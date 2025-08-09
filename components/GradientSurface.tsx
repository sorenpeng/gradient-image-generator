"use client";
import React, { useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import { buildFlowerPalette, PaletteSpec } from "../lib/palettes/flower";
import { buildDreamlikePalette } from "../lib/palettes/dreamlike";
import { buildSkyPalette } from "../lib/palettes/sky";
import { buildFlowerField, FieldSpec } from "../lib/styles/flower";
import { buildDreamlikeField } from "../lib/styles/dreamlike";
import { buildSkyField } from "../lib/styles/sky";
import { SVGRadialRenderer, SVGRadialHandle } from "../lib/renderers/svgRadial";

export interface GradientSurfaceHandle {
  exportSVG(): string | null;
  exportPNG(scale?: number): Promise<Blob | null>;
}
export type StyleType = "flower" | "dreamlike" | "sky";
export interface GradientSurfaceProps {
  styleType?: StyleType;
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
  animateMode?: "none" | "drift" | "pulse" | "parallax";
  mouseInfluence?: number;
}

function buildPaletteByStyle(style: StyleType, seed: string | number) {
  switch (style) {
    case "dreamlike":
      return buildDreamlikePalette(seed);
    case "sky":
      return buildSkyPalette(seed);
    default:
      return buildFlowerPalette(seed);
  }
}
function buildFieldByStyle(
  style: StyleType,
  seed: string | number,
  palette: PaletteSpec
) {
  switch (style) {
    case "dreamlike":
      return buildDreamlikeField(seed, palette);
    case "sky":
      return buildSkyField(seed, palette);
    default:
      return buildFlowerField(seed, palette);
  }
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
    animateMode = "drift",
    mouseInfluence = 0.6,
  },
  ref
) {
  const palette = useMemo(() => {
    if (paletteExternal) return paletteExternal;
    return buildPaletteByStyle(styleType, seed);
  }, [paletteExternal, seed, styleType]);
  const field = useMemo(() => {
    if (fieldSpec) return fieldSpec;
    return buildFieldByStyle(styleType, seed, palette);
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
        animateMode={animateMode}
        mouseInfluence={mouseInfluence}
      />
    );
  }
  return null;
});
