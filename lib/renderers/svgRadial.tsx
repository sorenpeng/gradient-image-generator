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
export interface SVGRadialProps {
  palette: PaletteSpec;
  field: FieldSpec;
  width: number;
  height: number;
  seed: string | number;
  animate?: boolean;
  className?: string;
  onExport?(svgText: string): void;
  onExportPng?(blob: Blob): void;
  pngScale?: number;
  showInternalExportButtons?: boolean;
  addNoise?: boolean;
  noiseStrength?: number; // 0..1
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

    useEffect(() => {
      if (!animate) return;
      let af = 0;
      const start = performance.now();
      const loop = (t: number) => {
        const k = (t - start) / 1000;
        const svg = svgRef.current;
        if (svg) svg.style.setProperty("--t", k.toString());
        af = requestAnimationFrame(loop);
      };
      af = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(af);
    }, [animate, seed]);

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
      return null;
    }

    useImperativeHandle(
      ref,
      () => ({ exportSVG: exportSVGInternal, exportPNG: exportPNGInternal }),
      [palette, field, seed, pngScale, addNoise, noiseStrength]
    );

    return (
      <div className={className} style={{ position: "relative" }}>
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
            <g
              key={i}
              transform={`translate(${layer.center.x * width} ${
                layer.center.y * height
              }) rotate(${(layer.rotation * 57.2958).toFixed(
                2
              )}) scale(${layer.scale.x.toFixed(3)} ${layer.scale.y.toFixed(
                3
              )}) translate(${-(layer.center.x * width)} ${-(
                layer.center.y * height
              )})`}
            >
              <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill={`url(#g_${i})`}
                opacity={layer.opacity.toFixed(3)}
              />
            </g>
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
  const n = 8;
  const scale = strength * 24; // amplitude
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const t = BAYER_8[(y & 7) * 8 + (x & 7)] / 63 - 0.5; // -0.5..0.5
      const offset = t * scale;
      d[idx] = clampByte(d[idx] + offset);
      d[idx + 1] = clampByte(d[idx + 1] + offset);
      d[idx + 2] = clampByte(d[idx + 2] + offset);
    }
  }
  ctx.putImageData(data, 0, 0);
}
function clampByte(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
