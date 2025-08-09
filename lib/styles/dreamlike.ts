// lib/styles/dreamlike.ts
import { hashSeed, mulberry32 } from "../random";
import { FieldSpec, RadialLayer } from "./flower"; // reuse interfaces
import { PaletteSpec } from "../palettes/flower";

export function buildDreamlikeField(
  seed: string | number,
  palette: PaletteSpec
): FieldSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|field|dream"));
  const layerCount = 7 + Math.floor(rng() * 6); // 7-12 extra richness
  const layers: RadialLayer[] = [];
  const baseAngle = rng() * Math.PI * 2;
  for (let i = 0; i < layerCount; i++) {
    const t = i / (layerCount - 1);
    const radius = 0.5 + t * 0.75 + rng() * 0.12;
    const angle = baseAngle + (rng() - 0.5) * 1.4;
    const dist = (0.04 + t * 0.45) * (0.35 + rng() * 0.95);
    const cx = 0.5 + Math.cos(angle) * dist;
    const cy = 0.5 + Math.sin(angle) * dist;
    const opacity = 0.3 + (1 - t) * 0.5; // slightly higher
    const scale = { x: 1 + (rng() - 0.5) * 0.95, y: 1 + (rng() - 0.5) * 0.95 };
    const rotation = rng() * Math.PI * 2;
    const a = Math.floor(rng() * palette.stops.length);
    const b =
      (a + 1 + Math.floor(rng() * (palette.stops.length - 1))) %
      palette.stops.length;
    layers.push({
      id: `D${i}`,
      center: { x: cx, y: cy },
      radius,
      scale,
      rotation,
      opacity,
      stopIndices: [a, b],
      focusJitter: 0.06 + rng() * 0.12,
    });
  }
  return { layers };
}
