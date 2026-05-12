import type { Problem } from "./forge-types";

/**
 * Seed problems for the demo. Sponsor mode adds new ones at runtime.
 * Hidden tests live ONLY here on the server-side import path; never sent to client.
 */

export const SEED_PROBLEMS: Problem[] = [
  {
    id: "two-sum-classic",
    title: "Two Sum",
    prompt: `## Two Sum
Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume each input has exactly one solution, and you may not use the same element twice.

**Example**

\`\`\`
nums = [2, 7, 11, 15], target = 9 → [0, 1]
\`\`\`
`,
    language: "typescript",
    starterCode: {
      typescript: `export function twoSum(nums: number[], target: number): number[] {
  // your code here
  return [];
}
`,
    },
    publicTests: `import { twoSum } from "./solution";
console.assert(JSON.stringify(twoSum([2,7,11,15], 9)) === "[0,1]", "case 1");
console.assert(JSON.stringify(twoSum([3,2,4], 6)) === "[1,2]", "case 2");
`,
    hiddenTests: `import { twoSum } from "./solution";
console.assert(JSON.stringify(twoSum([3,3], 6)) === "[0,1]", "h1");
console.assert(JSON.stringify(twoSum([-1,-2,-3,-4,-5], -8)) === "[2,4]", "h2");
console.assert(JSON.stringify(twoSum([0,4,3,0], 0)) === "[0,3]", "h3");
`,
    difficulty: "easy",
    tags: ["array", "hashmap"],
    timeBudgetSec: 600,
  },
  {
    id: "anchor-pda-derive",
    title: "Derive a PDA",
    prompt: `## Derive a Solana PDA
Implement \`derivePda(programId, seeds)\` that returns the [pda, bump] tuple for the given seeds.

Use \`@solana/web3.js\` \`PublicKey.findProgramAddressSync\`.

**Why this matters**

PDA derivation is the single most-used primitive in Anchor programs. Get this right blindfolded.
`,
    language: "typescript",
    starterCode: {
      typescript: `import { PublicKey } from "@solana/web3.js";

export function derivePda(programId: PublicKey, seeds: (Buffer | Uint8Array)[]): [PublicKey, number] {
  // your code here
  return [PublicKey.default, 0];
}
`,
    },
    publicTests: `import { PublicKey } from "@solana/web3.js";
import { derivePda } from "./solution";
const pid = new PublicKey("11111111111111111111111111111111");
const [pda, bump] = derivePda(pid, [Buffer.from("forge")]);
console.assert(pda instanceof PublicKey, "returns PublicKey");
console.assert(bump >= 0 && bump <= 255, "bump in range");
`,
    hiddenTests: `import { PublicKey } from "@solana/web3.js";
import { derivePda } from "./solution";
const pid = new PublicKey("11111111111111111111111111111111");
const [pda] = derivePda(pid, [Buffer.from("forge"), Buffer.from("match")]);
const [expected] = PublicKey.findProgramAddressSync([Buffer.from("forge"), Buffer.from("match")], pid);
console.assert(pda.equals(expected), "matches reference");
`,
    difficulty: "medium",
    tags: ["solana", "anchor", "pda"],
    timeBudgetSec: 480,
  },
  {
    id: "rate-limit-window",
    title: "Sliding-Window Rate Limiter",
    prompt: `## Sliding-Window Rate Limiter
Implement \`RateLimiter(capacity, windowMs)\`. \`limiter.allow(now)\` returns \`true\` if at most \`capacity\` requests occurred in the last \`windowMs\` ms ending at \`now\` (inclusive of the new one), \`false\` otherwise.

**Constraint:** O(1) amortised per call. No external libraries.
`,
    language: "typescript",
    starterCode: {
      typescript: `export class RateLimiter {
  constructor(private capacity: number, private windowMs: number) {}

  allow(now: number): boolean {
    // your code here
    return false;
  }
}
`,
    },
    publicTests: `import { RateLimiter } from "./solution";
const r = new RateLimiter(3, 1000);
console.assert(r.allow(0) === true);
console.assert(r.allow(100) === true);
console.assert(r.allow(200) === true);
console.assert(r.allow(300) === false, "4th in window denied");
`,
    hiddenTests: `import { RateLimiter } from "./solution";
const r = new RateLimiter(2, 500);
console.assert(r.allow(0));
console.assert(r.allow(100));
console.assert(!r.allow(200));
console.assert(r.allow(700), "old request expires");
`,
    difficulty: "medium",
    tags: ["data-structure", "queue"],
    timeBudgetSec: 720,
  },
];

export function getProblem(id: string): Problem | undefined {
  return SEED_PROBLEMS.find((p) => p.id === id);
}

/** Public-safe view (strips hidden tests). */
export function publicProblem(p: Problem): Omit<Problem, "hiddenTests"> {
  const { hiddenTests: _h, ...rest } = p;
  void _h;
  return rest;
}
