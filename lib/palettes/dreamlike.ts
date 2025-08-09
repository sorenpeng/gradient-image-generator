// lib/palettes/dreamlike.ts
import { hashSeed, mulberry32 } from "../random";
import { PaletteSpec, PaletteStop } from "./flower";
import { toCss } from "../color";

// Dreamlike: previously soft low-contrast; now add stronger complementary accents while retaining airy feel.
export function buildDreamlikePalette(seed: string | number): PaletteSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|palette|dream"));
  // Pick a base cool hue cluster and derive a soft warm complement for gentle clash.
  const base = rng() * 360; // central hue
  const complement = (base + 180 + rng() * 30 - 15 + 360) % 360; // complementary band
  const span = 50 + rng() * 60; // broader hue span for more variety
  const count = 6 + Math.floor(rng() * 3); // 6-8 stops for smooth but rich gradient
  const accentIndex = 2 + Math.floor(rng() * (count - 4)); // somewhere in middle
  const warmIndex = accentIndex + 1;
  const stops: PaletteStop[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1 || 1);
    // Base analog sweep
    let h = (base - span / 2 + span * t + 720) % 360;
    // Inject complementary accent(s)
    if (i === accentIndex || i === warmIndex) {
      const mixT = i === accentIndex ? 0.4 : 0.65; // two slightly different variants
      h = (complement * mixT + h * (1 - mixT) + 360) % 360;
    }
    // Lightness: airy center, slight dim at ends for depth
    const l =
      0.62 + 0.18 * Math.sin((t - 0.5) * Math.PI) + (rng() - 0.5) * 0.05;
    // Chroma: elevate vs prior version for stronger color presence
    const c = 0.14 + 0.08 * Math.cos(t * Math.PI * 2) + (rng() - 0.5) * 0.05;
    stops.push({ pos: t, color: { l, c, h } });
  }
  const css = stops.map((s) => toCss(s.color));
  return { stops, css };
}
