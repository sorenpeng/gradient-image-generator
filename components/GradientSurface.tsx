"use client";
import React, { useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import { buildFlowerPalette, PaletteSpec } from "../lib/palettes/flower";
import { buildFlowerField, FieldSpec } from "../lib/styles/flower";
import { SVGRadialRenderer, SVGRadialHandle } from "../lib/renderers/svgRadial";

export interface GradientSurfaceHandle {
  exportSVG(): string | null;
  exportPNG(scale?: number): Promise<Blob | null>;
}
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
  addNoise?: boolean;
  noiseStrength?: number;
}

export const GradientSurface = forwardRef<
  GradientSurfaceHandle,
  GradientSurfaceProps
>(function GradientSurfaceFn(
  {
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
    addNoise = false,
    noiseStrength = 0.25,
  },
  ref
) {
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

  const innerRef = useRef<SVGRadialHandle | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      exportSVG: () => innerRef.current?.exportSVG() ?? null,
      exportPNG: (scale?: number) =>
        innerRef.current?.exportPNG(scale) ?? Promise.resolve(null),
    }),
    []
  );

  if (renderer === "svg") {
    return (
      <SVGRadialRenderer
        ref={innerRef}
        palette={palette}
        field={field}
        width={width}
        height={height}
        seed={seed}
        onExport={onExportSVG}
        onExportPng={onExportPNG}
        pngScale={pngScale}
        addNoise={addNoise}
        noiseStrength={noiseStrength}
      />
    );
  }
  return null;
});
