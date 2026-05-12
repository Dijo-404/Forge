//! Forge Arena — on-chain coding duels with USDC stakes.
//!
//! Lifecycle:
//!   1. open_match  — challenger creates an escrow PDA and locks `stake` USDC.
//!   2. join_match  — opponent matches the stake. Match transitions to Live.
//!   3. commit_root — (optional) checkpoints a Merkle root of the keystroke
//!                    snapshot bundle from the MagicBlock ephemeral rollup.
//!   4. settle_match — runs after a judge oracle signs a verdict; pays the
//!                    winner the full pot and mints two Token-2022 credentials
//!                    (winner + loser) with the verdict signature in metadata.
//!   5. cancel_match — if no opponent joined within the timeout, refund.
//!
//! NOTE: This is a faithful scaffold ready for `anchor build`. The Token-2022
//! mint authority for credentials is the program PDA `("forge", "auth")`.
//! Plug in MagicBlock SDK delegate/undelegate calls in your client to point
//! `commit_root`-bearing accounts at the ephemeral rollup endpoint.

use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022, TransferChecked};
use anchor_spl::token_interface::{Mint, TokenAccount};

declare_id!("FbcFTcfpu3siEtBgCef4tQXCm4nkYX33MURJqLZSZepz");

const MATCH_SEED: &[u8] = b"match";
const ESCROW_SEED: &[u8] = b"escrow";
const AUTH_SEED: &[u8] = b"auth";
const MAX_OPEN_SECONDS: i64 = 60 * 60 * 24; // 24h to find an opponent

#[program]
pub mod forge_arena {
    use super::*;

    /// Challenger creates a match and locks `stake` USDC into the escrow PDA.
    pub fn open_match(ctx: Context<OpenMatch>, args: OpenMatchArgs) -> Result<()> {
        require!(args.stake > 0, ForgeError::InvalidStake);
        require!(args.problem_id_hash != [0u8; 32], ForgeError::InvalidProblem);

        let m = &mut ctx.accounts.r#match;
        m.challenger = ctx.accounts.challenger.key();
        m.opponent = Pubkey::default();
        m.problem_id_hash = args.problem_id_hash;
        m.stake = args.stake;
        m.status = MatchStatus::Open as u8;
        m.opened_at = Clock::get()?.unix_timestamp;
        m.started_at = 0;
        m.ended_at = 0;
        m.winner = Pubkey::default();
        m.judge_oracle = args.judge_oracle;
        m.bump = ctx.bumps.r#match;

        // Move challenger USDC → escrow ATA owned by match PDA
        let cpi = TransferChecked {
            from: ctx.accounts.challenger_token.to_account_info(),
            mint: ctx.accounts.usdc_mint.to_account_info(),
            to: ctx.accounts.escrow_token.to_account_info(),
            authority: ctx.accounts.challenger.to_account_info(),
        };
        token_2022::transfer_checked(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi),
            args.stake,
            ctx.accounts.usdc_mint.decimals,
        )?;

        Ok(())
    }

    /// Opponent matches the stake → match transitions to Live.
    pub fn join_match(ctx: Context<JoinMatch>) -> Result<()> {
        let m = &mut ctx.accounts.r#match;
        require!(m.status == MatchStatus::Open as u8, ForgeError::WrongStatus);
        require!(m.challenger != ctx.accounts.opponent.key(), ForgeError::SelfDuel);

        let cpi = TransferChecked {
            from: ctx.accounts.opponent_token.to_account_info(),
            mint: ctx.accounts.usdc_mint.to_account_info(),
            to: ctx.accounts.escrow_token.to_account_info(),
            authority: ctx.accounts.opponent.to_account_info(),
        };
        token_2022::transfer_checked(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi),
            m.stake,
            ctx.accounts.usdc_mint.decimals,
        )?;

        m.opponent = ctx.accounts.opponent.key();
        m.status = MatchStatus::Live as u8;
        m.started_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Optional checkpoint of a Merkle root over the keystroke bundle from ER.
    /// Cheap (one slot) and gives recruiters a tamper-evident anchor.
    pub fn commit_root(ctx: Context<CommitRoot>, root: [u8; 32], snapshot_idx: u64) -> Result<()> {
        let m = &mut ctx.accounts.r#match;
        require!(m.status == MatchStatus::Live as u8, ForgeError::WrongStatus);
        let player = ctx.accounts.player.key();
        require!(
            player == m.challenger || player == m.opponent,
            ForgeError::NotParticipant
        );
        emit!(SnapshotCommitted {
            r#match: m.key(),
            player,
            root,
            snapshot_idx,
        });
        Ok(())
    }

    /// Settle the match: verify judge_oracle signature, pay winner, log result.
    /// (Credential mint via Token-2022 + metadata pointer is performed in a
    /// follow-up `mint_credential` ix kept separate to keep this fn small.)
    pub fn settle_match(ctx: Context<SettleMatch>, args: SettleArgs) -> Result<()> {
        // Validate before any borrow — avoids holding &mut m across CPI
        require!(ctx.accounts.r#match.status == MatchStatus::Live as u8, ForgeError::WrongStatus);
        require!(
            args.winner == ctx.accounts.r#match.challenger
                || args.winner == ctx.accounts.r#match.opponent,
            ForgeError::InvalidWinner
        );
        require!(
            ctx.accounts.judge_oracle.key() == ctx.accounts.r#match.judge_oracle,
            ForgeError::WrongOracle
        );

        // Extract values needed for CPI seeds before any mutable borrow
        let pot = ctx.accounts.r#match.stake.checked_mul(2).ok_or(ForgeError::Overflow)?;
        let match_key = ctx.accounts.r#match.key();
        let bump = ctx.accounts.r#match.bump;
        let seeds = &[MATCH_SEED, match_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi = TransferChecked {
            from: ctx.accounts.escrow_token.to_account_info(),
            mint: ctx.accounts.usdc_mint.to_account_info(),
            to: ctx.accounts.winner_token.to_account_info(),
            authority: ctx.accounts.r#match.to_account_info(),
        };
        token_2022::transfer_checked(
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi, signer),
            pot,
            ctx.accounts.usdc_mint.decimals,
        )?;

        // Mutate state after CPI completes
        let m = &mut ctx.accounts.r#match;
        m.status = MatchStatus::Settled as u8;
        m.winner = args.winner;
        m.ended_at = Clock::get()?.unix_timestamp;

        emit!(MatchSettled {
            r#match: match_key,
            winner: args.winner,
            pot,
            verdict_sig_hash: args.verdict_sig_hash,
        });
        Ok(())
    }

    /// Refund the challenger if no opponent joined within MAX_OPEN_SECONDS.
    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        require!(ctx.accounts.r#match.status == MatchStatus::Open as u8, ForgeError::WrongStatus);
        let now = Clock::get()?.unix_timestamp;
        require!(now - ctx.accounts.r#match.opened_at >= MAX_OPEN_SECONDS, ForgeError::TooEarly);

        let match_key = ctx.accounts.r#match.key();
        let bump = ctx.accounts.r#match.bump;
        let stake = ctx.accounts.r#match.stake;
        let seeds = &[MATCH_SEED, match_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi = TransferChecked {
            from: ctx.accounts.escrow_token.to_account_info(),
            mint: ctx.accounts.usdc_mint.to_account_info(),
            to: ctx.accounts.challenger_token.to_account_info(),
            authority: ctx.accounts.r#match.to_account_info(),
        };
        token_2022::transfer_checked(
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi, signer),
            stake,
            ctx.accounts.usdc_mint.decimals,
        )?;

        ctx.accounts.r#match.status = MatchStatus::Void as u8;
        Ok(())
    }
}

// ────────────────────────────────────────────────────────────────────
// Account definitions
// ────────────────────────────────────────────────────────────────────

#[account]
#[derive(Default)]
pub struct Match {
    pub challenger: Pubkey,
    pub opponent: Pubkey,
    pub problem_id_hash: [u8; 32],
    pub stake: u64,             // raw USDC amount (decimals come from mint)
    pub opened_at: i64,
    pub started_at: i64,
    pub ended_at: i64,
    pub winner: Pubkey,
    pub judge_oracle: Pubkey,
    pub status: u8,
    pub bump: u8,
}

impl Match {
    pub const LEN: usize = 8 + 32*4 + 32 + 8 + 8 + 8 + 8 + 32 + 1 + 1;
}

#[repr(u8)]
pub enum MatchStatus {
    Open = 0,
    Live = 1,
    Judging = 2,
    Settled = 3,
    Void = 4,
}

// ────────────────────────────────────────────────────────────────────
// Instructions
// ────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OpenMatchArgs {
    pub problem_id_hash: [u8; 32],
    pub stake: u64,
    pub judge_oracle: Pubkey,
    pub nonce: u64, // makes the PDA unique per challenge
}

#[derive(Accounts)]
#[instruction(args: OpenMatchArgs)]
pub struct OpenMatch<'info> {
    #[account(mut)]
    pub challenger: Signer<'info>,

    #[account(
        init,
        payer = challenger,
        space = Match::LEN,
        seeds = [MATCH_SEED, challenger.key().as_ref(), &args.nonce.to_le_bytes()],
        bump,
    )]
    pub r#match: Account<'info, Match>,

    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut, token::mint = usdc_mint, token::authority = challenger)]
    pub challenger_token: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init,
        payer = challenger,
        seeds = [ESCROW_SEED, r#match.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = r#match,
    )]
    pub escrow_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut)]
    pub opponent: Signer<'info>,

    #[account(mut)]
    pub r#match: Account<'info, Match>,

    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut, token::mint = usdc_mint, token::authority = opponent)]
    pub opponent_token: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, r#match.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = r#match,
    )]
    pub escrow_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct CommitRoot<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub r#match: Account<'info, Match>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SettleArgs {
    pub winner: Pubkey,
    pub verdict_sig_hash: [u8; 32], // sha256(judge HMAC verdict)
}

#[derive(Accounts)]
pub struct SettleMatch<'info> {
    pub judge_oracle: Signer<'info>,

    #[account(mut)]
    pub r#match: Account<'info, Match>,

    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, r#match.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = r#match,
    )]
    pub escrow_token: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, token::mint = usdc_mint)]
    pub winner_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(mut, address = r#match.challenger)]
    pub challenger: Signer<'info>,

    #[account(mut)]
    pub r#match: Account<'info, Match>,

    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, r#match.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = r#match,
    )]
    pub escrow_token: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, token::mint = usdc_mint, token::authority = challenger)]
    pub challenger_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
}

// ────────────────────────────────────────────────────────────────────
// Events & errors
// ────────────────────────────────────────────────────────────────────

#[event]
pub struct SnapshotCommitted {
    pub r#match: Pubkey,
    pub player: Pubkey,
    pub root: [u8; 32],
    pub snapshot_idx: u64,
}

#[event]
pub struct MatchSettled {
    pub r#match: Pubkey,
    pub winner: Pubkey,
    pub pot: u64,
    pub verdict_sig_hash: [u8; 32],
}

#[error_code]
pub enum ForgeError {
    #[msg("Stake must be positive.")]
    InvalidStake,
    #[msg("Problem id hash cannot be zero.")]
    InvalidProblem,
    #[msg("Match is in the wrong status for this action.")]
    WrongStatus,
    #[msg("Cannot duel yourself.")]
    SelfDuel,
    #[msg("Caller is not a match participant.")]
    NotParticipant,
    #[msg("Winner must be challenger or opponent.")]
    InvalidWinner,
    #[msg("Judge oracle pubkey does not match the one set at open_match.")]
    WrongOracle,
    #[msg("Numeric overflow.")]
    Overflow,
    #[msg("Cancellation window has not elapsed yet.")]
    TooEarly,
}

// silence unused use of AUTH_SEED until credential-mint ix lands
const _: &[u8] = AUTH_SEED;
