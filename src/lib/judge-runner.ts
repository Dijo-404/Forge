/**
 * Real, sandboxed JS/TS judge using node:vm.
 *
 * SECURITY NOTE: node:vm is NOT a true sandbox — it shares the parent realm.
 * For production, swap with Judge0 or a microVM (Firecracker / gVisor).
 * For hackathon devnet demo with pre-vetted seed problems, the surface is
 * acceptable: we strip globals, set a wall-clock timeout, and only run code
 * we accept via authenticated POST.
 *
 * This is real evaluation — no mocks. The verdict signature is HMAC-SHA256
 * over a canonical JSON payload using a server-side secret, which the on-
 * chain `settle` instruction can later verify against an oracle pubkey.
 */

import vm from "node:vm";
import { createHmac, randomUUID } from "node:crypto";
import type { JudgeVerdict } from "./forge-types";

const JUDGE_SECRET = process.env.JUDGE_SECRET ?? "forge-devnet-judge-key";

interface RunResult {
  passed: boolean;
  total: number;
  passedCount: number;
  stderr?: string;
  runtimeMs: number;
}

export async function judgeTypescript(
  solution: string,
  publicTests: string,
  hiddenTests: string
): Promise<RunResult> {
  // Strip TS-only syntax cheaply for vm.runInNewContext.
  // For production, transpile with esbuild. For seed problems, this is OK.
  const stripped = solution
    .replace(/^\s*import[^;]+;?$/gm, "")
    .replace(/export\s+(async\s+)?function/g, "function")
    .replace(/export\s+class/g, "class")
    .replace(/export\s+const/g, "const")
    .replace(/:\s*[A-Za-z_<>[\],\s|]+(?=\s*[=,)\]{])/g, "")
    .replace(/<[A-Za-z_, ]+>(?=\()/g, "");

  // Simulate a tiny module system: tests `import { x } from "./solution"` becomes `const { x } = solution`.
  const testWrapper = (testSrc: string) =>
    testSrc
      .replace(/^\s*import\s+(.+?)\s+from\s+["']\.\/solution["'];?\s*$/gm, "const $1 = solution;")
      .replace(/^\s*import[^;]+;?$/gm, "");

  const start = Date.now();
  const errors: string[] = [];
  let assertCount = 0;
  let assertPass = 0;

  const ctx = vm.createContext({
    console: {
      assert: (cond: unknown, msg?: string) => {
        assertCount++;
        if (cond) {
          assertPass++;
        } else {
          errors.push(`assert failed: ${msg ?? "(no message)"}`);
        }
      },
      log: () => {},
      error: (...args: unknown[]) => errors.push(args.join(" ")),
    },
    Buffer,
    Map,
    Set,
    JSON,
    Math,
    Number,
    String,
    Object,
    Array,
    Date,
    setTimeout: () => {
      throw new Error("setTimeout disabled in judge");
    },
  });

  try {
    // 1. compile the solution → expose its named exports as `solution`
    const solSrc = `const solution = (function() { ${stripped}; return { ${pluckExports(stripped).join(", ")} }; })();`;
    vm.runInContext(solSrc, ctx, { timeout: 1500 });

    // 2. run public + hidden tests in the same context
    vm.runInContext(testWrapper(publicTests), ctx, { timeout: 1500 });
    vm.runInContext(testWrapper(hiddenTests), ctx, { timeout: 1500 });
  } catch (e: unknown) {
    errors.push(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  }

  const runtimeMs = Date.now() - start;
  return {
    passed: errors.length === 0 && assertPass === assertCount && assertCount > 0,
    total: assertCount,
    passedCount: assertPass,
    stderr: errors.length ? errors.join("\n") : undefined,
    runtimeMs,
  };
}

/** Quick & dirty export pluck: finds top-level `function NAME` and `class NAME` and `const NAME =`. */
function pluckExports(src: string): string[] {
  const names = new Set<string>();
  const re = /(?:function|class)\s+([A-Za-z_]\w*)|const\s+([A-Za-z_]\w*)\s*=/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const n = m[1] ?? m[2];
    if (n) names.add(n);
  }
  return Array.from(names);
}

export function signVerdict(v: Omit<JudgeVerdict, "signature">): string {
  const canonical = JSON.stringify(v);
  return createHmac("sha256", JUDGE_SECRET).update(canonical).digest("hex");
}

export function newVerdictId(): string {
  return randomUUID();
}
