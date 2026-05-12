#!/usr/bin/env bash
# Seeds 3 demo matches against the running dev server so judges land on
# a populated Arena instead of an empty page.
#
# Usage: ./scripts/seed-demo.sh [BASE_URL]
#   BASE_URL defaults to http://localhost:3000

set -euo pipefail

BASE=${1:-http://localhost:3000}

# Three throwaway devnet wallets (these are NOT secret — public sample wallets only)
W1="3xJK6srZTsP3iWLb2a7G2bMcF7sN7vRgYqn1pV3kkWbE"
W2="9F3FNGJYqBNyhfh5x6FQ1zEPQjv6KtTqvT6FZqYTDDv4"
W3="CKwYsr8wHb6XRJ7Vm9rCwH9QKt8CaHRwvkGZcAQwbBkK"

echo "🌱 Seeding demo matches at $BASE"

post() {
  local who="$1" pid="$2" stake="$3"
  curl -s -X POST "$BASE/api/matches" \
    -H "content-type: application/json" \
    -d "{\"challenger\":\"$who\",\"problemId\":\"$pid\",\"stakeUsdc\":$stake}" \
    | jq -r '.match.id // .error'
}

echo "  1. two-sum-classic    @ 1 USDC  → $(post "$W1" two-sum-classic 1)"
echo "  2. anchor-pda-derive  @ 2 USDC  → $(post "$W2" anchor-pda-derive 2)"
echo "  3. rate-limit-window  @ 5 USDC  → $(post "$W3" rate-limit-window 5)"
echo "✅ Done. Open $BASE/arena"
