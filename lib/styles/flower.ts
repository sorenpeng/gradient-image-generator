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
  const layerCount = 4 + Math.floor(rng() * 5); // 4-8 for richer overlap
  const axisAngle = rng() * Math.PI * 2;
  const layers: RadialLayer[] = [];
  for (let i = 0; i < layerCount; i++) {
    const t = i / layerCount;
    const dist = (0.05 + t * 0.3) * (0.35 + rng() * 0.95); // allow tighter clustering
    const dir = axisAngle + (rng() - 0.5) * 1.0; // more scatter
    const cx = 0.5 + Math.cos(dir) * dist;
    const cy = 0.5 + Math.sin(dir) * dist;
    const radius = 0.4 + t * 0.6 + rng() * 0.18; // slightly larger variation
    const scale = { x: 1 + (rng() - 0.5) * 0.75, y: 1 + (rng() - 0.5) * 0.75 };
    const rotation = rng() * Math.PI * 2;
    const opacity = 0.42 + (1 - t) * 0.55; // higher base opacity
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
      focusJitter: 0.06 + rng() * 0.18,
    });
  }
  return { layers };
}
