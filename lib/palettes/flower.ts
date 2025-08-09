// lib/palettes/flower.ts
import { RNG } from "../rng";
import { OKLCH, randomOKLCH, toCss } from "../color";

export interface PaletteStop {
  pos: number;
  color: OKLCH;
}
export interface PaletteSpec {
  stops: PaletteStop[];
  css: string[];
}

export function buildFlowerPalette(rng: RNG): PaletteSpec {
  const warmHue = rng() * 50 + 330; // wrap near magenta/red (330-380)
  const coolHue = (warmHue + 140 + rng() * 40) % 360; // green-cyan region
  const count = 3 + Math.floor(rng() * 3); // 3-5 stops
  const stops: PaletteStop[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const hueCluster = t < 0.55 ? warmHue : coolHue; // center biased warm
    const l = 0.55 + (1 - Math.abs(t - 0.4)) * 0.25 + (rng() - 0.5) * 0.06; // center brighter
    const c = 0.12 + (t < 0.55 ? 0.18 : 0.1) + (rng() - 0.5) * 0.05;
    const h = (hueCluster + (rng() - 0.5) * 18 + 360) % 360;
    stops.push({ pos: t, color: { l, c, h } });
  }
  // ensure monotonic-ish lightness (allow slight rebound)
  for (let i = 1; i < stops.length; i++) {
    if (stops[i].color.l < stops[i - 1].color.l - 0.18) {
      stops[i].color.l = stops[i - 1].color.l - 0.12;
    }
  }
  const css = stops.map((s) => toCss(s.color));
  return { stops, css };
}
