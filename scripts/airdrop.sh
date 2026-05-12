#!/usr/bin/env bash
# Loop devnet airdrops with backoff. Stops when balance reaches TARGET (default 5).
set -euo pipefail

TARGET=${1:-5}
MAX_ATTEMPTS=${2:-40}

solana config set --url devnet >/dev/null
WALLET=$(solana address)
echo "🪂 Airdropping to $WALLET until balance ≥ ${TARGET} SOL"

attempt=0
while (( attempt < MAX_ATTEMPTS )); do
  bal=$(solana balance | awk '{print $1}')
  printf "  attempt %2d · balance %s SOL\n" "$attempt" "$bal"
  awk -v b="$bal" -v t="$TARGET" 'BEGIN{exit !(b+0 >= t+0)}' && {
    echo "✅ Reached ${TARGET} SOL"
    exit 0
  }
  if solana airdrop 2 >/dev/null 2>&1; then
    sleep 3
  else
    echo "  rate-limited, sleeping 30s"
    sleep 30
  fi
  attempt=$((attempt + 1))
done

echo "❌ Did not reach ${TARGET} SOL in ${MAX_ATTEMPTS} attempts"
echo "   Try the web faucet: https://faucet.solana.com"
exit 1
