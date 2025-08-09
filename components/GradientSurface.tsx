"use client";
import React, { useMemo } from "react";
import { buildFlowerPalette } from "../lib/palettes/flower";
import { buildFlowerField } from "../lib/styles/flower";
import { SVGRadialRenderer } from "../lib/renderers/svgRadial";

export interface GradientSurfaceProps {
  styleType?: "flower";
  renderer?: "svg";
  seed: string | number;
  width?: number;
  height?: number;
}

export const GradientSurface: React.FC<GradientSurfaceProps> = ({
  styleType = "flower",
  renderer = "svg",
  seed,
  width = 1000,
  height = 1000,
}) => {
  const palette = useMemo(() => buildFlowerPalette(seed), [seed]);
  const field = useMemo(() => buildFlowerField(seed, palette), [seed, palette]);

  if (renderer === "svg") {
    return (
      <SVGRadialRenderer
        palette={palette}
        field={field}
        width={width}
        height={height}
        seed={seed}
      />
    );
  }
  return null;
};
