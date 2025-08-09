太好了！下面是基于“默认提案”的**可直接跑的 Next.js MVP**。特点：

- 多层 `<radialGradient>`（默认 4 层）
- OKLCH 调色（CSS 原生 `oklch()`，更平滑）
- 鼠标/触摸驱动焦点 + 轻微半径变化，带“临界阻尼”式平滑
- `?seed=...` 可复现；`随机`按钮可换一组
- `prefers-reduced-motion` 自动降级为静态帧
- 一键导出 SVG（PNG 可后续加）

---

# 1) 目录结构（App Router）

```
app/
  page.tsx
  globals.css
components/
  GradientBG.tsx
lib/
  random.ts
  palette.ts
```

---

# 2) `lib/random.ts`（可复现 RNG + 工具）

```ts
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
```

---

# 3) `lib/palette.ts`（OKLCH 调色板生成）

```ts
// lib/palette.ts
import { mulberry32, hashSeed } from "./random";

export type Oklch = { l: number; c: number; h: number }; // 0..1 / 0..~0.37 / 0..360

export function oklch(l: number, c: number, h: number) {
  // 直接返回 CSS 字符串，现代浏览器原生支持
  const L = (l * 100).toFixed(2);
  const C = (c * 0.37).toFixed(3); // 经验上 0.37 附近较安全
  const H = (h * 360).toFixed(1);
  return `oklch(${L}% ${C} ${H})`;
}

export function makePalette(seed: string, count = 6) {
  const rnd = mulberry32(hashSeed(seed));
  // 选一个基准色相与亮度，避免脏色
  const baseH = rnd(); // 0..1
  const baseL = 0.6 + (rnd() - 0.5) * 0.15; // 0.525..0.675
  const baseC = 0.22 + (rnd() - 0.5) * 0.1; // 0.17..0.27（较安全）

  const pals: string[] = [];
  for (let i = 0; i < count; i++) {
    const h = (baseH + (i / count) * (0.35 + rnd() * 0.2)) % 1; // 分布一些
    const l = Math.min(0.82, Math.max(0.38, baseL + (rnd() - 0.5) * 0.18));
    const c = Math.min(0.33, Math.max(0.12, baseC + (rnd() - 0.5) * 0.12));
    pals.push(oklch(l, c, h));
  }
  return pals;
}
```

---

# 4) `components/GradientBG.tsx`（核心组件）

```tsx
// components/GradientBG.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { hashSeed, mulberry32, follow, clamp01 } from "@/lib/random";
import { makePalette } from "@/lib/palette";

type Props = {
  seed?: string;
  layers?: number; // 2..6
  inertia?: number; // 0..1  越大越平滑，建议 0.85
  quality?: "low" | "med" | "high"; // 影响半径范围等
  className?: string;
  style?: React.CSSProperties;
};

export default function GradientBG({
  seed = "demo",
  layers = 4,
  inertia = 0.85,
  quality = "high",
  className,
  style,
}: Props) {
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const seedInt = useMemo(() => hashSeed(seed), [seed]);
  const rand = useMemo(() => mulberry32(seedInt), [seedInt]);
  const palette = useMemo(() => makePalette(seed, 8), [seed]);

  // 目标中心（相对坐标 0..1），当前中心用于平滑
  const [target, setTarget] = useState({ x: 0.5, y: 0.5 });
  const curr = useRef({ x: 0.5, y: 0.5 });

  // 基本配置（每层一个配置）
  const layerCfg = useMemo(() => {
    const arr: {
      id: string;
      stops: { offset: number; color: string; opacity: number }[];
      baseRadius: number; // 相对最小边
      opacity: number;
      jitterR: number;
      focusJitter: number;
    }[] = [];

    for (let i = 0; i < layers; i++) {
      const c1 = palette[(i * 2) % palette.length];
      const c2 = palette[(i * 2 + 1) % palette.length];
      const o = 0.45 + rand() * 0.35; // 0.45..0.8
      const br =
        quality === "low"
          ? 0.65 + rand() * 0.25
          : quality === "med"
            ? 0.75 + rand() * 0.35
            : 0.85 + rand() * 0.45; // 半径比例
      arr.push({
        id: `g${i}`,
        stops: [
          { offset: 0, color: c1, opacity: o },
          { offset: 1, color: c2, opacity: 0 }, // 边缘淡出
        ],
        baseRadius: br,
        opacity: 0.6 + rand() * 0.4,
        jitterR: 0.05 + rand() * 0.12,
        focusJitter: 0.1 + rand() * 0.18,
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, quality, seed]); // 保持与 seed 关联
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 动画循环
  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    const tick = () => {
      curr.current.x = follow(curr.current.x, target.x, inertia);
      curr.current.y = follow(curr.current.y, target.y, inertia);
      // 通过 CSS 变量暴露给 SVG
      const el = containerRef.current;
      if (el) {
        el.style.setProperty("--cx", curr.current.x.toString());
        el.style.setProperty("--cy", curr.current.y.toString());
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target.x, target.y, inertia, reducedMotion]);

  // 事件：鼠标/触摸更新目标
  function onPointerMove(e: React.PointerEvent) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    setTarget({ x, y });
    if (reducedMotion) {
      // reduce 模式直接设置（无动画）
      curr.current = { x, y };
      const el = containerRef.current;
      if (el) {
        el.style.setProperty("--cx", x.toString());
        el.style.setProperty("--cy", y.toString());
      }
    }
  }

  // 初始变量
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.style.setProperty("--cx", "0.5");
      el.style.setProperty("--cy", "0.5");
    }
  }, []);

  // 轻微“呼吸”漂移：鼠标静止也有细微变化（reduce 模式关闭）
  useEffect(() => {
    if (reducedMotion) return;
    let af = 0;
    const baseX = rand();
    const baseY = rand();
    const start = performance.now();
    const loop = (t: number) => {
      const el = containerRef.current;
      if (el) {
        const k = (t - start) / 1000;
        const dx = Math.sin(k * 0.15 + baseX * 10) * 0.01;
        const dy = Math.cos(k * 0.13 + baseY * 10) * 0.01;
        el.style.setProperty("--bx", dx.toFixed(4));
        el.style.setProperty("--by", dy.toFixed(4));
      }
      af = requestAnimationFrame(loop);
    };
    af = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(af);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, reducedMotion]);

  // 导出 SVG
  function exportSVG() {
    const svg = document.querySelector("#gradient-svg") as SVGSVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gradient_${seed}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerMove}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <svg
        id="gradient-svg"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <defs>
          {layerCfg.map((cfg, i) => {
            // 每层中心= 鼠标中心 + 少量抖动
            const varCx = `calc(var(--cx, 0.5) + var(--bx, 0) * ${(
              0.5 * cfg.focusJitter
            ).toFixed(3)})`;
            const varCy = `calc(var(--cy, 0.5) + var(--by, 0) * ${(
              0.5 * cfg.focusJitter
            ).toFixed(3)})`;

            // 半径基于短边比例，同时随鼠标略变
            const varR = `calc(${cfg.baseRadius.toFixed(
              3,
            )} * min(1000px, 1000px) * (1 + (${i} * 0.02)))`;

            return (
              <radialGradient
                key={cfg.id}
                id={cfg.id}
                gradientUnits="userSpaceOnUse"
                // 通过 CSS 变量控制中心
                cx={`calc(${varCx} * 1000)`}
                cy={`calc(${varCy} * 1000)`}
                r={varR}
                fx={`calc(${varCx} * 1000)`}
                fy={`calc(${varCy} * 1000)`}
              >
                {cfg.stops.map((s, idx) => (
                  <stop
                    key={idx}
                    offset={s.offset}
                    stopColor={s.color}
                    stopOpacity={s.opacity}
                  />
                ))}
              </radialGradient>
            );
          })}
        </defs>

        {/* 多个 rect 叠加 */}
        {layerCfg.map((cfg, i) => (
          <rect
            key={cfg.id}
            x="0"
            y="0"
            width="1000"
            height="1000"
            fill={`url(#${cfg.id})`}
            opacity={cfg.opacity}
          />
        ))}
      </svg>

      {/* 顶部简易工具栏 */}
      <div
        style={{
          position: "absolute",
          inset: 12,
          display: "flex",
          gap: 8,
          alignItems: "start",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            backdropFilter: "blur(8px)",
            background: "color-mix(in srgb, white 28%, transparent)",
            borderRadius: 12,
            padding: "8px 10px",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            onClick={() => {
              const s = Math.random().toString(36).slice(2, 8);
              const url = new URL(window.location.href);
              url.searchParams.set("seed", s);
              window.location.href = url.toString();
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #0001",
              cursor: "pointer",
            }}
            title="随机换一组（带 seed）"
          >
            🎲 随机
          </button>
          <button
            onClick={exportSVG}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #0001",
              cursor: "pointer",
            }}
            title="导出为 SVG"
          >
            ⬇️ 导出 SVG
          </button>
          <span style={{ fontSize: 12, opacity: 0.8 }}>seed: {seed}</span>
        </div>
      </div>
    </div>
  );
}
```

---

# 5) `app/page.tsx`（Demo 页）

```tsx
// app/page.tsx
import GradientBG from "@/components/GradientBG";
import "./globals.css";
import { Suspense } from "react";
import { headers } from "next/headers";

function Demo() {
  const h = headers();
  const url = new URL(h.get("x-url") || "http://localhost");
  const seed = url.searchParams.get("seed") || "mvp";
  return (
    <main style={{ height: "100dvh", width: "100vw" }}>
      <GradientBG seed={seed} layers={4} inertia={0.87} quality="high" />
      <div className="hero">
        <h1>Layered SVG Radial Gradients</h1>
        <p>
          Move your mouse / touch to explore. Add <code>?seed=xxxxx</code> to
          share.
        </p>
      </div>
    </main>
  );
}

// 为了在 Edge/Node 里拿到完整 URL，你可以在 middleware 里注入 x-url；
// 不想加 middleware 的话，改成客户端用 useSearchParams 读取即可。
export default function Page() {
  return (
    <Suspense>
      <Demo />
    </Suspense>
  );
}
```

> 如果不想配 `headers()`：把读取 seed 的逻辑挪到客户端组件里（`"use client";` + `useSearchParams()`），或者直接在 `GradientBG` 外层包一层 Client 组件读取搜索参数。

**可选（更稳）客户端版本：**

```tsx
// app/page.tsx（客户端读取 seed）
"use client";
import GradientBG from "@/components/GradientBG";
import "./globals.css";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const sp = useSearchParams();
  const seed = sp.get("seed") || "mvp";
  return (
    <main style={{ height: "100dvh", width: "100vw" }}>
      <GradientBG seed={seed} layers={4} inertia={0.87} quality="high" />
      <div className="hero">
        <h1>Layered SVG Radial Gradients</h1>
        <p>
          Move your mouse / touch to explore. Add <code>?seed=xxxxx</code> to
          share.
        </p>
      </div>
    </main>
  );
}
```

---

# 6) `app/globals.css`（基础样式与可访问）

```css
/* app/globals.css */
* {
  box-sizing: border-box;
}
html,
body {
  height: 100%;
  margin: 0;
}
body {
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Arial,
    "Apple Color Emoji",
    "Segoe UI Emoji";
}

.hero {
  position: absolute;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  padding: 10px 14px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  background: color-mix(in srgb, white 24%, transparent);
  color: #0b0b0b;
  text-align: center;
}

.hero h1 {
  margin: 0 0 6px;
  font-size: 20px;
  line-height: 1.2;
  letter-spacing: 0.2px;
}

.hero p {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

@media (prefers-color-scheme: dark) {
  .hero {
    background: color-mix(in srgb, black 24%, transparent);
    color: #f5f5f5;
  }
}
```

---

# 7) 运行方式

```bash
pnpm dlx create-next-app@latest gradient-mvp --ts --app --eslint --src-dir=false --tailwind=false
cd gradient-mvp
# 把上述文件放到对应目录（覆盖 app/page.tsx 与 app/globals.css；新增 components/ 与 lib/）
pnpm dev
```

打开：`http://localhost:3000/?seed=aurora`（随便换 seed）

---

# 8) 后续可加的小升级

- 导出 PNG：用 `foreignObject + canvas` 或把 SVG 串投喂到 `<img>` 然后 `canvas.toDataURL()`。
- 移动端惯性更柔顺：根据 `devicePixelRatio` 自适配半径。
- 主题预设与控制面板：暴露 `palette`/`layers`/`inertia`/`quality` 到 UI。
- OG Image：加一个 `/api/og`，把 seed 渲染为社交卡片。

---

如果你愿意，我也可以把读取 seed 的逻辑、导出 PNG、以及一个极简控制面板（层数/随机）一并加上。你先跑跑这个 MVP，看看手感如何？
