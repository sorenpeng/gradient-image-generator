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
  // Base hue (petal warm) & a cool counter hue further apart for stronger clash
  const baseHue = rng() * 360; // warm/any
  const coolHue = (baseHue + 150 + rng() * 60) % 360; // 150-210 apart
  // Accent hue roughly analogous shift to base for triadic feel
  const accentHue = (baseHue + 60 + rng() * 40) % 360; // 60-100 offset
  // Decide number of stops (4-6) for richer transitions
  const count = 4 + Math.floor(rng() * 3); // 4-6
  const stops: PaletteStop[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1 || 1);
    // Choose hue cluster: early/middle mostly base+accent, last third may jump to cool for clash
    let hue: number;
    if (t > 0.65) {
      hue = coolHue;
    } else if (t > 0.4) {
      hue = rng() < 0.5 ? accentHue : baseHue;
    } else {
      hue = rng() < 0.7 ? baseHue : accentHue;
    }
    // Add local jitter
    hue = (hue + (rng() - 0.5) * 24 + 360) % 360;
    // Chroma boosted for stronger expression. Early sections more saturated.
    const cBase = t < 0.7 ? 0.22 : 0.16;
    const c = cBase + (rng() - 0.5) * 0.07 + (t < 0.25 ? 0.07 : 0);
    // Lightness variation: keep mid portions lighter, edges slightly darker for depth
    const l = 0.55 + 0.25 * (1 - Math.abs(t - 0.4)) + (rng() - 0.5) * 0.07;
    stops.push({ pos: t, color: { l, c, h: hue } });
  }
  // Ensure monotonic large drops not too harsh (gentle smoothing)
  for (let i = 1; i < stops.length; i++) {
    if (stops[i].color.l < stops[i - 1].color.l - 0.22) {
      stops[i].color.l = stops[i - 1].color.l - 0.18;
    }
  }
  const css = stops.map((s) => toCss(s.color));
  return { stops, css };
}
