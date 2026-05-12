# Forge — WSL2 deploy walkthrough

Recommended path for Windows users. Native-Windows Solana setup needs MSVC Build Tools (6 GB) **and** the Anza installer — WSL2 sidesteps both with a clean Linux toolchain.

Total time: ~15 min. All commands are copy-paste safe.

---

## 1. Install Ubuntu under WSL2 (one-time, ~3 min)

Open **PowerShell as Administrator** on Windows:

```powershell
wsl --install -d Ubuntu
```

Restart when prompted. After reboot, Ubuntu opens automatically — set a Linux username + password.

If WSL is already set up but you don't have Ubuntu:

```powershell
wsl --list --online       # see available distros
wsl --install -d Ubuntu
```

---

## 2. Open Ubuntu and install the toolchain (~10 min)

From now on, **all commands run inside the Ubuntu shell** (not PowerShell):

```bash
# System deps
sudo apt update
sudo apt install -y build-essential pkg-config libssl-dev libudev-dev jq curl

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal
source "$HOME/.cargo/env"

# Solana CLI (Anza)
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Verify
rustc --version
solana --version
anchor --version
```

Expected output: rustc ≥ 1.75, solana ≥ 1.18, anchor 0.30.1.

---

## 3. Get to the Forge project from inside WSL

The repo lives on your Windows drive, accessible from Ubuntu via `/mnt/c/`:

```bash
cd "/mnt/c/Users/admin/Desktop/stuff/100x devs proj/forge"
ls   # confirm you see Anchor.toml, programs/, scripts/, src/
```

---

## 4. Set up Solana wallet + airdrop devnet SOL

```bash
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json   # press enter to skip passphrase
solana address                                          # note this — your deployer pubkey
chmod +x scripts/airdrop.sh scripts/deploy.sh scripts/seed-demo.sh
./scripts/airdrop.sh 5
```

If the CLI faucet rate-limits, supplement with:
- https://faucet.solana.com (web)
- https://faucet.quicknode.com/solana/devnet

---

## 5. Deploy the Anchor program

You have two scenarios:

### 5a. You don't have a pre-generated program keypair → fresh deploy

```bash
anchor build                  # generates target/deploy/forge_arena-keypair.json
anchor keys list              # prints the program id
anchor keys sync              # syncs declare_id! to match the keypair
anchor build                  # rebuild with the synced id
anchor deploy --provider.cluster devnet
```

Copy the printed program id and paste it into `.env.local` as `NEXT_PUBLIC_FORGE_PROGRAM_ID`.

### 5b. You already pinned `4dGRdj8reoafLtQtZrqy6hsiLFh6zmbLRVD7DUUxjWat`

Either:
- Place its matching keypair file at `target/deploy/forge_arena-keypair.json` (if you have it), then `anchor build && anchor deploy`, OR
- Drop that pin and use 5a — Anchor will generate a fresh program id and you tell me what it is so I can update the codebase.

> ⚠️ The 32-byte address `4dGRdj8...` is a valid pubkey, but Anchor needs the *private key* of that address to claim it on-chain. If you only have the pubkey (e.g. it's just a wallet you control), use 5a instead.

---

## 6. Run the frontend (still on Windows-native works fine)

The Next.js dev server can run on either side. Easiest:

**Option A — run on Windows** (what we've already set up):
```powershell
# In PowerShell on Windows
cd "C:\Users\admin\Desktop\stuff\100x devs proj\forge"
npm install
npm run dev
```

**Option B — run inside WSL**:
```bash
# In Ubuntu
cd "/mnt/c/Users/admin/Desktop/stuff/100x devs proj/forge"
npm install
npm run dev
```

Either way, open http://localhost:3000.

---

## 7. Verify on-chain mode

Open http://localhost:3000/status. The page reads live from the configured RPC and should show:

- ✅ Cluster: devnet
- ✅ Solana core: 1.18.x
- ✅ Block height (live)
- ✅ USDC mint: live
- ✅ Forge program id: deployed

The Arena's "Open match" button gains a green "On-chain mode · program ..." caption. Clicking it now triggers a real Solana transaction.

---

## 8. Recovery if something breaks

```bash
# Recover most rent SOL from a deployed program
solana program close <PROGRAM_ID> --bypass-warning

# If anchor build complains about declare_id! mismatch
anchor keys sync
anchor build

# If devnet RPC rate-limits during dev
# Use Helius free tier:
#   https://dev.helius.xyz/dashboard/app → grab API key
# Then in .env.local:
#   NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

---

## Why WSL2 over native Windows for this

- Anchor's `cargo build-sbf` ships only Linux/macOS toolchains; on native Windows it bridges via WSL anyway.
- The Anza `solana-install-init` installer for Windows works but needs MSVC Build Tools (~6 GB).
- The official Anchor docs and every Solana tutorial assume Linux/macOS shell.
- File watchers, signal handling, and hot-reload all behave more predictably.

You can keep editing files in VS Code on Windows — they live on the Windows filesystem (`/mnt/c/...` from WSL's view), so both sides see the same files in real time.
