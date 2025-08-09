// lib/palettes/flower.ts
import { hashSeed, mulberry32 } from "../random";
import { OKLCH, toCss } from "../color";

export interface PaletteStop {
  pos: number;
  color: OKLCH;
}
export interface PaletteSpec {
  stops: PaletteStop[];
  css: string[];
}

// Deterministic: only depends on seed string
export function buildFlowerPalette(seed: string | number): PaletteSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|palette"));
  const warmHue = rng() * 50 + 330;
  const coolHue = (warmHue + 140 + rng() * 40) % 360;
  const count = 3 + Math.floor(rng() * 3);
  const stops: PaletteStop[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1 || 1);
    const hueCluster = t < 0.55 ? warmHue : coolHue;
    const l = 0.55 + (1 - Math.abs(t - 0.4)) * 0.25 + (rng() - 0.5) * 0.06;
    const c = 0.12 + (t < 0.55 ? 0.18 : 0.1) + (rng() - 0.5) * 0.05;
    const h = (hueCluster + (rng() - 0.5) * 18 + 360) % 360;
    stops.push({ pos: t, color: { l, c, h } });
  }
  for (let i = 1; i < stops.length; i++) {
    if (stops[i].color.l < stops[i - 1].color.l - 0.18) {
      stops[i].color.l = stops[i - 1].color.l - 0.12;
    }
  }
  const css = stops.map((s) => toCss(s.color));
  return { stops, css };
}
