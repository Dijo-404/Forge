"use client";

/** SHA-256 → 32-byte Uint8Array. Works in browser & Node. */
export async function sha256(input: string | Uint8Array): Promise<Uint8Array> {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(buf);
}

/** Build a Merkle root from a list of leaves (already hashed or raw). */
export async function merkleRoot(leaves: (string | Uint8Array)[]): Promise<Uint8Array> {
  if (leaves.length === 0) return new Uint8Array(32);
  let layer = await Promise.all(leaves.map((l) => sha256(l)));
  while (layer.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = i + 1 < layer.length ? layer[i + 1] : layer[i];
      const concat = new Uint8Array(left.length + right.length);
      concat.set(left, 0);
      concat.set(right, left.length);
      next.push(await sha256(concat));
    }
    layer = next;
  }
  return layer[0];
}
