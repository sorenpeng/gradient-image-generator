"use client";
import React, { useMemo } from "react";
import { buildFlowerPalette, PaletteSpec } from "../lib/palettes/flower";
import { buildFlowerField, FieldSpec } from "../lib/styles/flower";
import { SVGRadialRenderer } from "../lib/renderers/svgRadial";

export interface GradientSurfaceProps {
  styleType?: "flower";
  renderer?: "svg";
  seed: string | number;
  width?: number;
  height?: number;
  palette?: PaletteSpec;
  fieldSpec?: FieldSpec;
  onExportSVG?(svgText: string): void;
  onExportPNG?(blob: Blob): void;
  pngScale?: number;
}

export const GradientSurface: React.FC<GradientSurfaceProps> = ({
  styleType = "flower",
  renderer = "svg",
  seed,
  width = 1000,
  height = 1000,
  palette: paletteExternal,
  fieldSpec,
  onExportSVG,
  onExportPNG,
  pngScale = 1,
}) => {
  const palette = useMemo(() => {
    if (paletteExternal) return paletteExternal; // external control
    if (styleType === "flower") return buildFlowerPalette(seed);
    return buildFlowerPalette(seed);
  }, [paletteExternal, seed, styleType]);

  const field = useMemo(() => {
    if (fieldSpec) return fieldSpec;
    if (styleType === "flower") return buildFlowerField(seed, palette);
    return buildFlowerField(seed, palette);
  }, [fieldSpec, seed, styleType, palette]);

  if (renderer === "svg") {
    return (
      <SVGRadialRenderer
        palette={palette}
        field={field}
        width={width}
        height={height}
        seed={seed}
        onExport={onExportSVG}
        onExportPng={onExportPNG}
        pngScale={pngScale}
      />
    );
  }
  return null;
};
