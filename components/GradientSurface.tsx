"use client";
import React, { useMemo } from "react";
import { createRng } from "../lib/rng";
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
  const rng = useMemo(() => createRng(seed), [seed]);
  const palette = useMemo(() => buildFlowerPalette(rng), [rng]);
  const field = useMemo(() => buildFlowerField(rng, palette), [rng, palette]);

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
