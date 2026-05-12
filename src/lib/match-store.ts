/**
 * In-process match store with SSE event bus.
 *
 * Real-time path uses Next.js route handlers + ReadableStream SSE.
 * For multi-instance / production: swap this with Redis Streams or
 * the MagicBlock ephemeral rollup state — same interface.
 */

import type { Match, MatchSnapshot } from "./forge-types";

type Listener = (event: StoreEvent) => void;

export type StoreEvent =
  | { kind: "match:created"; match: Match }
  | { kind: "match:joined"; match: Match }
  | { kind: "match:snapshot"; matchId: string; snapshot: MatchSnapshot }
  | { kind: "match:settled"; match: Match }
  | { kind: "match:status"; matchId: string; status: Match["status"] };

class MatchStore {
  private matches = new Map<string, Match>();
  private snapshots = new Map<string, MatchSnapshot[]>();
  private listeners = new Set<Listener>();

  list(): Match[] {
    return Array.from(this.matches.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  get(id: string): Match | undefined {
    return this.matches.get(id);
  }

  create(m: Match): Match {
    this.matches.set(m.id, m);
    this.snapshots.set(m.id, []);
    this.emit({ kind: "match:created", match: m });
    return m;
  }

  update(id: string, patch: Partial<Match>): Match | undefined {
    const cur = this.matches.get(id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch };
    this.matches.set(id, next);
    if (patch.status) this.emit({ kind: "match:status", matchId: id, status: patch.status });
    return next;
  }

  pushSnapshot(snap: MatchSnapshot): void {
    const list = this.snapshots.get(snap.matchId);
    if (!list) return;
    list.push(snap);
    // keep only last 200 per match to bound memory
    if (list.length > 200) list.splice(0, list.length - 200);
    this.emit({ kind: "match:snapshot", matchId: snap.matchId, snapshot: snap });
  }

  snapshotsFor(id: string): MatchSnapshot[] {
    return this.snapshots.get(id) ?? [];
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(e: StoreEvent): void {
    for (const l of this.listeners) {
      try { l(e); } catch { /* swallow listener errors */ }
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __forge_match_store__: MatchStore | undefined;
}

export const matchStore: MatchStore =
  globalThis.__forge_match_store__ ?? (globalThis.__forge_match_store__ = new MatchStore());
