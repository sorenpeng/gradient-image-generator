// lib/renderers/svgRadial.tsx
"use client";
import React, { useEffect, useRef } from "react";
import { PaletteSpec } from "../palettes/flower";
import { FieldSpec } from "../styles/flower";

export interface SVGRadialProps {
  palette: PaletteSpec;
  field: FieldSpec;
  width: number;
  height: number;
  seed: string | number;
  animate?: boolean;
  className?: string;
  onExport?(svgText: string): void;
}

export const SVGRadialRenderer: React.FC<SVGRadialProps> = ({
  palette,
  field,
  width,
  height,
  seed,
  animate = true,
  className,
  onExport,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!animate) return;
    let af = 0;
    const start = performance.now();
    const loop = (t: number) => {
      const k = (t - start) / 1000;
      const svg = ref.current;
      if (svg) {
        svg.style.setProperty("--t", k.toString());
      }
      af = requestAnimationFrame(loop);
    };
    af = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(af);
  }, [animate, seed]);

  function handleExport() {
    if (!ref.current) return;
    const xml = new XMLSerializer().serializeToString(ref.current);
    onExport?.(xml);
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      <svg
        ref={ref}
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
      <button
        style={{ position: "absolute", top: 8, right: 8 }}
        onClick={handleExport}
      >
        Export SVG
      </button>
    </div>
  );
};
