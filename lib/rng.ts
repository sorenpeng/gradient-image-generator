// lib/rng.ts
// Unified seeded RNG helper (wrapping mulberry32) plus utilities to get multiple independent streams.
import { hashSeed, mulberry32 } from "./random";

export type RNG = () => number;

export function createRng(seed: string | number): RNG {
  const s = typeof seed === "number" ? seed : hashSeed(String(seed));
  return mulberry32(s);
}

// Split a rng into n new rng functions using jump-ahead by consuming values.
export function split(rng: RNG, count: number): RNG[] {
  return Array.from({ length: count }, (_, i) => {
    // advance rng a few times to decorrelate
    let acc = 0;
    for (let k = 0; k < 3 + i; k++) acc = rng();
    return mulberry32(Math.floor(acc * 0xffffffff));
  });
}
