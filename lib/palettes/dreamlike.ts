// lib/palettes/dreamlike.ts
import { hashSeed, mulberry32 } from "../random";
import { PaletteSpec, PaletteStop } from "./flower";
import { toCss } from "../color";

// Dreamlike: analogous cool-warm soft palette, low contrast, higher lightness.
export function buildDreamlikePalette(seed: string | number): PaletteSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|palette|dream"));
  // pick a base hue cluster (e.g. 200-300 or 120-180)
  const clusterCenters = [rng() * 360, (rng() * 120 + 160) % 360];
  const base = clusterCenters[Math.floor(rng() * clusterCenters.length)];
  const span = 40 + rng() * 50; // hue span
  const count = 5 + Math.floor(rng() * 3); // 5-7 stops
  const stops: PaletteStop[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1 || 1);
    const h = (base - span / 2 + span * t + 720) % 360;
    const l = 0.6 + (rng() - 0.5) * 0.08 + 0.15 * Math.sin((t - 0.5) * Math.PI);
    const c = 0.1 + (rng() - 0.5) * 0.04 + 0.05 * Math.cos(t * Math.PI * 2);
    stops.push({ pos: t, color: { l, c, h } });
  }
  const css = stops.map((s) => toCss(s.color));
  return { stops, css };
}
