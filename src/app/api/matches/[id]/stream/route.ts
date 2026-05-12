import { NextRequest } from "next/server";
import { matchStore } from "@/lib/match-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Initial replay so reconnects don't miss state
      const m = matchStore.get(id);
      if (m) send("status", { status: m.status });

      const unsub = matchStore.subscribe((e) => {
        if ("matchId" in e && e.matchId !== id) return;
        if (!("matchId" in e) && "match" in e && e.match.id !== id) return;

        switch (e.kind) {
          case "match:snapshot":
            send("snapshot", e.snapshot);
            break;
          case "match:status":
            send("status", { status: e.status });
            break;
          case "match:settled":
            send("settled", e.match);
            break;
          case "match:joined":
            send("status", { status: e.match.status });
            break;
          default:
            break;
        }
      });

      // Heartbeat every 25s to keep the connection alive through proxies
      const hb = setInterval(() => {
        controller.enqueue(enc.encode(`: ping\n\n`));
      }, 25_000);

      // close handler
      const close = () => {
        clearInterval(hb);
        unsub();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      // request abort signal — Next.js wires this through to the underlying stream
      _req.signal.addEventListener("abort", close);
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
