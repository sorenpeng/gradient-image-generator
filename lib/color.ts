// lib/color.ts
// OKLCH helpers & interpolation
export interface OKLCH {
  l: number;
  c: number;
  h: number;
} // h in degrees

export function clamp(v: number, a = 0, b = 1) {
  return v < a ? a : v > b ? b : v;
}

export function toCss({ l, c, h }: OKLCH) {
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(2)})`;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
export function lerpAngle(a: number, b: number, t: number) {
  const d = ((b - a + 540) % 360) - 180; // shortest path
  return a + d * t;
}
export function lerpOKLCH(a: OKLCH, b: OKLCH, t: number): OKLCH {
  return {
    l: lerp(a.l, b.l, t),
    c: lerp(a.c, b.c, t),
    h: lerpAngle(a.h, b.h, t),
  };
}

export function randomOKLCH(
  rng: () => number,
  base: Partial<OKLCH> = {}
): OKLCH {
  return {
    l: base.l ?? 0.4 + rng() * 0.4,
    c: base.c ?? 0.05 + rng() * 0.25,
    h: base.h ?? rng() * 360,
  };
}

export function toSRGBApprox(c: OKLCH): { r: number; g: number; b: number } {
  // Minimal placeholder: fallback approximate conversion using CSS by creating a color string and letting browser parse later.
  // For server-side or tests you may implement full OKLab->sRGB pipeline.
  // Here we just approximate by returning neutral value for constraints.
  return { r: c.l, g: c.l, b: c.l };
}
