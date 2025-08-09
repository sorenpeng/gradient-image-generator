// lib/styles/dreamlike.ts
import { hashSeed, mulberry32 } from "../random";
import { FieldSpec, RadialLayer } from "./flower"; // reuse interfaces
import { PaletteSpec } from "../palettes/flower";

export function buildDreamlikeField(
  seed: string | number,
  palette: PaletteSpec
): FieldSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|field|dream"));
  const layerCount = 6 + Math.floor(rng() * 6); // 6-11
  const layers: RadialLayer[] = [];
  const baseAngle = rng() * Math.PI * 2;
  for (let i = 0; i < layerCount; i++) {
    const t = i / (layerCount - 1);
    const radius = 0.55 + t * 0.65 + rng() * 0.1;
    const angle = baseAngle + (rng() - 0.5) * 1.2;
    const dist = (0.05 + t * 0.4) * (0.3 + rng() * 0.9);
    const cx = 0.5 + Math.cos(angle) * dist;
    const cy = 0.5 + Math.sin(angle) * dist;
    const opacity = 0.25 + (1 - t) * 0.55;
    const scale = { x: 1 + (rng() - 0.5) * 0.8, y: 1 + (rng() - 0.5) * 0.8 };
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
      focusJitter: 0.05 + rng() * 0.1,
    });
  }
  return { layers };
}
