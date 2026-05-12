import { NextRequest } from "next/server";
import { matchStore } from "@/lib/match-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Top-level match list stream — fires on any match create/join/settle. */
export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("hello", { ok: true });

      const unsub = matchStore.subscribe((e) => {
        if (e.kind === "match:created" || e.kind === "match:settled" || e.kind === "match:joined") {
          send("match", { kind: e.kind, match: e.match });
        } else if (e.kind === "match:status") {
          send("match", { kind: e.kind, matchId: e.matchId, status: e.status });
        }
      });

      const hb = setInterval(() => controller.enqueue(enc.encode(`: ping\n\n`)), 25_000);

      const close = () => {
        clearInterval(hb);
        unsub();
        try { controller.close(); } catch { /* already closed */ }
      };
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
