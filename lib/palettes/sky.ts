// lib/palettes/sky.ts
import { hashSeed, mulberry32 } from "../random";
import { PaletteSpec, PaletteStop } from "./flower";
import { toCss } from "../color";

// Sky palette: enhanced saturation & warmer horizon for stronger expression.
export function buildSkyPalette(seed: string | number): PaletteSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|palette|sky"));
  const sunrise = rng() < 0.6; // favor dramatic variant
  const baseBlue = 205 + rng() * 50; // 205-255
  const horizonWarm = sunrise ? 10 + rng() * 30 : 25 + rng() * 20;
  const violetCap = (baseBlue + 40 + rng() * 30) % 360; // introduce slight violet toward zenith
  const count = 6; // more stops for smoother but richer vertical shift
  const stops: PaletteStop[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    // Interpolate warm->blue->violet for extra depth
    const midBlend = Math.min(1, Math.max(0, (t - 0.35) / 0.35));
    const hBlue = horizonWarm * (1 - t) + baseBlue * t;
    const h = (hBlue * (1 - midBlend) + violetCap * midBlend + 360) % 360;
    const l = sunrise
      ? 0.58 + t * 0.25 + (rng() - 0.5) * 0.03
      : 0.55 + t * 0.22 + (rng() - 0.5) * 0.025;
    const c = sunrise
      ? 0.16 + (1 - t) * 0.14 + (rng() - 0.5) * 0.04
      : 0.14 + (1 - t) * 0.1 + (rng() - 0.5) * 0.035;
    stops.push({ pos: t, color: { l, c, h } });
  }
  const css = stops.map((s) => toCss(s.color));
  return { stops, css };
}
