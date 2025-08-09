// lib/renderers/svgRadial.tsx
"use client";
import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { PaletteSpec } from "../palettes/flower";
import { FieldSpec } from "../styles/flower";

export interface SVGRadialHandle {
  exportSVG(): string | null;
  exportPNG(scale?: number): Promise<Blob | null>;
}
export type AnimateMode = "none" | "drift" | "pulse" | "parallax";
export interface SVGRadialProps {
  palette: PaletteSpec;
  field: FieldSpec;
  width: number;
  height: number;
  seed: string | number;
  animate?: boolean;
  animateMode?: AnimateMode;
  mouseInfluence?: number;
  className?: string;
  onExport?(svgText: string): void;
  onExportPng?(blob: Blob): void;
  pngScale?: number;
  showInternalExportButtons?: boolean;
  addNoise?: boolean;
  noiseStrength?: number;
}

export const SVGRadialRenderer = forwardRef<SVGRadialHandle, SVGRadialProps>(
  function SVGRadialRendererFn(
    {
      palette,
      field,
      width,
      height,
      seed,
      animate = true,
      animateMode = "drift",
      mouseInfluence = 0.6,
      className,
      onExport,
      onExportPng,
      pngScale = 1,
      showInternalExportButtons = false,
      addNoise = false,
      noiseStrength = 0.25,
    },
    ref
  ) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const gradientsRef = useRef<SVGGradientElement[]>([]);
    const radiiRef = useRef<SVGGradientElement[]>([]); // not used separately; kept for future
    const pointerTarget = useRef({ x: 0, y: 0 });
    const pointerState = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

    function onPointerMove(e: React.PointerEvent) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      pointerTarget.current.x = nx;
      pointerTarget.current.y = ny;
    }

    useEffect(() => {
      if (!animate) return;
      let af = 0;
      let prevT = performance.now();
      const stiffness = 120;
      const damping = 18;
      const baseR = Math.min(width, height);
      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - prevT) / 1000);
        prevT = now;
        const ps = pointerState.current;
        const pt = pointerTarget.current;
        // spring integration (semi-implicit Euler)
        const ax = (pt.x - ps.x) * stiffness - ps.vx * damping;
        const ay = (pt.y - ps.y) * stiffness - ps.vy * damping;
        ps.vx += ax * dt;
        ps.vy += ay * dt;
        ps.x += ps.vx * dt;
        ps.y += ps.vy * dt;
        const t = now / 1000;
        const layers = field.layers;
        const gEls = gradientsRef.current;
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          const g = gEls[i];
          if (!g) continue;
          const depth = i / (layers.length - 1 || 1);
          let cx = layer.center.x * width;
          let cy = layer.center.y * height;
          let r = layer.radius * baseR;
          if (
            animateMode === "drift" ||
            animateMode === "parallax" ||
            animateMode === "pulse"
          ) {
            const driftAmp = 0.02; // relative
            if (animateMode === "drift" || animateMode === "parallax") {
              cx += Math.sin(t * 0.15 + i) * driftAmp * width * (0.3 + depth);
              cy +=
                Math.cos(t * 0.18 + i * 0.7) *
                driftAmp *
                height *
                (0.3 + depth * 0.8);
            }
            if (animateMode === "parallax" || animateMode === "drift") {
              const parallax = mouseInfluence * (0.15 + depth * 0.85);
              cx += ps.x * parallax * width * 0.3;
              cy += ps.y * parallax * height * 0.3;
            } else if (animateMode === "pulse") {
              // pointer only lightly influences pulse
              const parallax = mouseInfluence * 0.3;
              cx += ps.x * parallax * width * 0.25;
              cy += ps.y * parallax * height * 0.25;
            }
            if (animateMode === "pulse") {
              const pulse = 1 + Math.sin(t * 2 + i * 0.6) * 0.05;
              r *= pulse;
            }
          }
          // Update attributes directly
          g.setAttribute("cx", cx.toFixed(3));
          g.setAttribute("cy", cy.toFixed(3));
          g.setAttribute("r", r.toFixed(3));
          g.setAttribute("fx", cx.toFixed(3));
          g.setAttribute("fy", cy.toFixed(3));
        }
        af = requestAnimationFrame(loop);
      };
      af = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(af);
    }, [
      animate,
      animateMode,
      mouseInfluence,
      field.layers,
      width,
      height,
      seed,
    ]);

    function exportSVGInternal(): string | null {
      if (!svgRef.current) return null;
      const xml = new XMLSerializer().serializeToString(svgRef.current);
      onExport?.(xml);
      return xml;
    }
    async function exportPNGInternal(scale?: number): Promise<Blob | null> {
      if (!svgRef.current) return null;
      const xml = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      try {
        const img = await new Promise<HTMLImageElement>((res, rej) => {
          const im = new Image();
          im.onload = () => res(im);
          im.onerror = rej;
          im.src = url;
        });
        const s = scale || pngScale || 1;
        const targetW = Math.round(width * s);
        const targetH = Math.round(height * s);
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        if (addNoise && noiseStrength > 0)
          applyOrderedDither(ctx, targetW, targetH, noiseStrength);
        const blob: Blob | null = await new Promise((r) =>
          canvas.toBlob((b) => r(b), "image/png")
        );
        if (blob) onExportPng?.(blob);
        return blob;
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    useImperativeHandle(
      ref,
      () => ({ exportSVG: exportSVGInternal, exportPNG: exportPNGInternal }),
      [
        palette,
        field,
        seed,
        pngScale,
        addNoise,
        noiseStrength,
        animateMode,
        mouseInfluence,
      ]
    );

    return (
      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        className={className}
        style={{ position: "relative" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          <defs>
            {field.layers.map((layer, i) => {
              const [a, b] = layer.stopIndices;
              const c1 = palette.css[a];
              const c2 = palette.css[b];
              const id = `g_${i}`;
              return (
                <radialGradient
                  key={id}
                  id={id}
                  gradientUnits="userSpaceOnUse"
                  ref={(el) => {
                    if (el) gradientsRef.current[i] = el;
                  }}
                  cx={layer.center.x * width}
                  cy={layer.center.y * height}
                  r={layer.radius * Math.min(width, height)}
                >
                  <stop offset={0} stopColor={c1} stopOpacity={0.9} />
                  <stop offset={1} stopColor={c2} stopOpacity={0} />
                </radialGradient>
              );
            })}
          </defs>
          {field.layers.map((layer, i) => (
            <rect
              key={i}
              x={0}
              y={0}
              width={width}
              height={height}
              fill={`url(#g_${i})`}
              opacity={layer.opacity.toFixed(3)}
            />
          ))}
        </svg>
        {showInternalExportButtons && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              gap: 6,
            }}
          >
            <button onClick={() => exportSVGInternal()}>Export SVG</button>
            <button onClick={() => exportPNGInternal()}>PNG</button>
          </div>
        )}
      </div>
    );
  }
);

// 8x8 Bayer matrix (values 0..63). Provides ordered dithering approximating blue-noise distribution when scaled.
const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36,
  14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23,
  61, 29, 53, 21,
];
function applyOrderedDither(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  strength: number
) {
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  const scale = strength * 24;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const t = BAYER_8[(y & 7) * 8 + (x & 7)] / 63 - 0.5;
      const off = t * scale;
      d[idx] = clampByte(d[idx] + off);
      d[idx + 1] = clampByte(d[idx + 1] + off);
      d[idx + 2] = clampByte(d[idx + 2] + off);
    }
  }
  ctx.putImageData(data, 0, 0);
}
function clampByte(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
