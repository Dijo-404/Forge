#!/usr/bin/env bash
# Forge: one-shot devnet deploy with safety checks.
# Usage: ./scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔧 Forge devnet deploy"
echo "──────────────────────"

# 1. Cluster check
solana config set --url devnet >/dev/null
echo "  cluster: $(solana config get | grep 'RPC URL' | awk '{print $3}')"

# 2. Wallet + balance
if [[ ! -f "$HOME/.config/solana/id.json" ]]; then
  echo "❌ No keypair at ~/.config/solana/id.json"
  echo "   Run: solana-keygen new"
  exit 1
fi
WALLET=$(solana address)
BAL=$(solana balance | awk '{print $1}')
echo "  wallet:  $WALLET"
echo "  balance: $BAL SOL"

# Anchor programs need ~3-5 SOL for first deploy
if awk -v b="$BAL" 'BEGIN{exit !(b+0 < 4.5)}'; then
  echo "⚠️  Balance < 4.5 SOL — Anchor deploy typically needs 3-5 SOL."
  echo "   Run ./scripts/airdrop.sh 5 first, or continue at your own risk."
  read -r -p "Continue anyway? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || exit 1
fi

# 3. Build
echo
echo "🔨 anchor build"
anchor build

# 4. Deploy (Anchor handles the program-keypair generation on first run)
echo
echo "🚀 anchor deploy"
anchor deploy --provider.cluster devnet

# 5. Extract program id
PROGRAM_ID=$(anchor keys list 2>/dev/null | awk '/forge_arena/{print $2}')
if [[ -z "${PROGRAM_ID:-}" ]]; then
  echo "⚠️  Could not parse program id from \`anchor keys list\`"
  echo "    Get it manually with: anchor keys list"
else
  echo
  echo "✅ Deployed!"
  echo "   PROGRAM_ID = $PROGRAM_ID"
  echo
  echo "📝 Add this line to .env.local:"
  echo "   NEXT_PUBLIC_FORGE_PROGRAM_ID=$PROGRAM_ID"
  echo
  echo "Then restart \`npm run dev\` and the Arena flips to On-chain mode."
fi

echo
echo "💡 To recover most of the deploy SOL later:"
echo "   solana program close $PROGRAM_ID --bypass-warning"
