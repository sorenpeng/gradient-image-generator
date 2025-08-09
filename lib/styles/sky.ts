// lib/styles/sky.ts
import { hashSeed, mulberry32 } from "../random";
import { FieldSpec, RadialLayer } from "./flower";
import { PaletteSpec } from "../palettes/flower";

// Sky field: fewer large layers focusing on vertical structure.
export function buildSkyField(
  seed: string | number,
  palette: PaletteSpec
): FieldSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|field|sky"));
  const layerCount = 3 + Math.floor(rng() * 3); // 3-5
  const layers: RadialLayer[] = [];
  for (let i = 0; i < layerCount; i++) {
    const t = i / (layerCount - 1);
    const cx = 0.5 + (rng() - 0.5) * 0.05; // near center horizontally
    const cy = 0.1 + t * 0.8 + (rng() - 0.5) * 0.05; // vertical spread
    const radius = 0.9 + t * 0.6 + rng() * 0.1;
    const scale = { x: 1.6 + rng() * 0.4, y: 0.7 + rng() * 0.3 }; // wide ellipses
    const rotation = (rng() - 0.5) * 0.4; // slight tilt
    const opacity = 0.4 + (1 - t) * 0.4;
    const a = Math.floor(rng() * palette.stops.length);
    const b =
      (a + 1 + Math.floor(rng() * (palette.stops.length - 1))) %
      palette.stops.length;
    layers.push({
      id: `S${i}`,
      center: { x: cx, y: cy },
      radius,
      scale,
      rotation,
      opacity,
      stopIndices: [a, b],
      focusJitter: 0.02 + rng() * 0.05,
    });
  }
  return { layers };
}
