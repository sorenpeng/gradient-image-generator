// lib/styles/sky.ts
import { hashSeed, mulberry32 } from "../random";
import { FieldSpec, RadialLayer } from "./flower";
import { PaletteSpec } from "../palettes/flower";

// Sky field: enhanced for dramatic vertical color.
export function buildSkyField(
  seed: string | number,
  palette: PaletteSpec
): FieldSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|field|sky"));
  const layerCount = 4 + Math.floor(rng() * 3); // 4-6
  const layers: RadialLayer[] = [];
  for (let i = 0; i < layerCount; i++) {
    const t = i / (layerCount - 1);
    const cx = 0.5 + (rng() - 0.5) * 0.06; // near center horizontally
    const cy = 0.08 + t * 0.84 + (rng() - 0.5) * 0.055; // vertical spread
    const radius = 0.95 + t * 0.75 + rng() * 0.15; // slightly bigger
    const scale = { x: 1.8 + rng() * 0.5, y: 0.65 + rng() * 0.35 }; // wider
    const rotation = (rng() - 0.5) * 0.5; // slight tilt
    const opacity = 0.48 + (1 - t) * 0.42; // higher opacity
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
      focusJitter: 0.025 + rng() * 0.055,
    });
  }
  return { layers };
}
