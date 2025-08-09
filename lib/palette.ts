// lib/palette.ts
import { mulberry32, hashSeed } from "./random";

export type Oklch = { l: number; c: number; h: number };

export function oklch(l: number, c: number, h: number) {
  const L = (l * 100).toFixed(2);
  const C = (c * 0.37).toFixed(3);
  const H = (h * 360).toFixed(1);
  return `oklch(${L}% ${C} ${H})`;
}

export function makePalette(seed: string, count = 6) {
  const rnd = mulberry32(hashSeed(seed));
  const baseH = rnd();
  const baseL = 0.6 + (rnd() - 0.5) * 0.15;
  const baseC = 0.22 + (rnd() - 0.5) * 0.1;

  const pals: string[] = [];
  for (let i = 0; i < count; i++) {
    const h = (baseH + (i / count) * (0.35 + rnd() * 0.2)) % 1;
    const l = Math.min(0.82, Math.max(0.38, baseL + (rnd() - 0.5) * 0.18));
    const c = Math.min(0.33, Math.max(0.12, baseC + (rnd() - 0.5) * 0.12));
    pals.push(oklch(l, c, h));
  }
  return pals;
}

