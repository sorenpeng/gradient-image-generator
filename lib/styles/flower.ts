// lib/styles/flower.ts
// Flower style field / layer specification for SVG radial renderer
import { PaletteSpec } from "../palettes/flower";
import { hashSeed, mulberry32 } from "../random";

export interface RadialLayer {
  id: string;
  center: { x: number; y: number }; // 0..1
  radius: number; // relative to min(w,h)
  scale: { x: number; y: number };
  rotation: number; // rad
  opacity: number;
  stopIndices: [number, number]; // which palette stops to blend
  focusJitter: number;
}

export interface FieldSpec {
  layers: RadialLayer[];
}

export function buildFlowerField(
  seed: string | number,
  palette: PaletteSpec
): FieldSpec {
  const rng = mulberry32(hashSeed(String(seed) + "|field"));
  const layerCount = 3 + Math.floor(rng() * 5); // 3-7
  const axisAngle = rng() * Math.PI * 2;
  const layers: RadialLayer[] = [];
  for (let i = 0; i < layerCount; i++) {
    const t = i / layerCount;
    const dist = (0.08 + t * 0.35) * (0.4 + rng() * 0.9);
    const dir = axisAngle + (rng() - 0.5) * 0.9; // scatter along axis
    const cx = 0.5 + Math.cos(dir) * dist;
    const cy = 0.5 + Math.sin(dir) * dist;
    const radius = 0.45 + t * 0.55 + rng() * 0.15;
    const scale = { x: 1 + (rng() - 0.5) * 0.6, y: 1 + (rng() - 0.5) * 0.6 };
    const rotation = rng() * Math.PI;
    const opacity = 0.35 + (1 - t) * 0.55;
    const a = Math.floor(rng() * palette.stops.length);
    const b =
      (a + 1 + Math.floor(rng() * (palette.stops.length - 1))) %
      palette.stops.length;
    layers.push({
      id: `L${i}`,
      center: { x: cx, y: cy },
      radius,
      scale,
      rotation,
      opacity,
      stopIndices: [a, b],
      focusJitter: 0.05 + rng() * 0.15,
    });
  }
  return { layers };
}
