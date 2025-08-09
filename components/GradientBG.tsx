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

  const [target, setTarget] = useState({ x: 0.5, y: 0.5 });
  const curr = useRef({ x: 0.5, y: 0.5 });

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
      const o = 0.45 + rand() * 0.35;
      const br =
        quality === "low"
          ? 0.65 + rand() * 0.25
          : quality === "med"
            ? 0.75 + rand() * 0.35
            : 0.85 + rand() * 0.45;
      arr.push({
        id: `g${i}`,
        stops: [
          { offset: 0, color: c1, opacity: o },
          { offset: 1, color: c2, opacity: 0 },
        ],
        baseRadius: br,
        opacity: 0.6 + rand() * 0.4,
        jitterR: 0.05 + rand() * 0.12,
        focusJitter: 0.1 + rand() * 0.18,
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, quality, seed]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    const tick = () => {
      curr.current.x = follow(curr.current.x, target.x, inertia);
      curr.current.y = follow(curr.current.y, target.y, inertia);
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

  function onPointerMove(e: React.PointerEvent) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    setTarget({ x, y });
    if (reducedMotion) {
      curr.current = { x, y };
      const el = containerRef.current;
      if (el) {
        el.style.setProperty("--cx", x.toString());
        el.style.setProperty("--cy", y.toString());
      }
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.style.setProperty("--cx", "0.5");
      el.style.setProperty("--cy", "0.5");
    }
  }, []);

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
            const varCx = `calc(var(--cx, 0.5) + var(--bx, 0) * ${(
              0.5 * cfg.focusJitter
            ).toFixed(3)})`;
            const varCy = `calc(var(--cy, 0.5) + var(--by, 0) * ${(
              0.5 * cfg.focusJitter
            ).toFixed(3)})`;

            const varR = `calc(${cfg.baseRadius.toFixed(
              3,
            )} * min(1000px, 1000px) * (1 + (${i} * 0.02)))`;

            return (
              <radialGradient
                key={cfg.id}
                id={cfg.id}
                gradientUnits="userSpaceOnUse"
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

        {layerCfg.map((cfg) => (
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

