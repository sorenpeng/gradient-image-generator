// lib/random.ts
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str: string) {
  // 简单 FNV-1a 变体
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

// 临界阻尼的“跟随”：每帧向目标靠拢（简单一阶低通）
export function follow(curr: number, target: number, smooth: number) {
  // smooth ∈ (0,1), 越小越跟手，越大越平滑
  return lerp(curr, target, 1 - smooth);
}

