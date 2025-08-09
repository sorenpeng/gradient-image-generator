// lib/palettes/sky.ts
import { hashSeed, mulberry32 } from "../random";
import { PaletteSpec, PaletteStop } from "./flower";
import { toCss } from "../color";

// Sky palette: vertical gradient sunrise/regular variant.
export function buildSkyPalette(seed: string | number): PaletteSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|palette|sky"));
  const sunrise = rng() < 0.5; // variant
  const baseBlue = 200 + rng() * 40; // 200-240
  const warmHue = sunrise ? 20 + rng() * 25 : 30 + rng() * 10;
  const count = 5;
  const stops: PaletteStop[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    // blend warm at horizon (t near 0) to blue at top (t near 1)
    const h = warmHue * (1 - t) + baseBlue * t;
    const l = sunrise
      ? 0.7 + t * 0.05 + (rng() - 0.5) * 0.03
      : 0.62 + t * 0.1 + (rng() - 0.5) * 0.02;
    const c = sunrise
      ? 0.12 + (1 - t) * 0.08 + (rng() - 0.5) * 0.03
      : 0.1 + (1 - t) * 0.05 + (rng() - 0.5) * 0.02;
    stops.push({ pos: t, color: { l, c, h } });
  }
  const css = stops.map((s) => toCss(s.color));
  return { stops, css };
}
