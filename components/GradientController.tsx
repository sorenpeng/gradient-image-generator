"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { buildFlowerPalette, PaletteSpec } from "../lib/palettes/flower";
import { buildFlowerField, FieldSpec } from "../lib/styles/flower";
import { GradientSurface, GradientSurfaceHandle } from "./GradientSurface";
import { hashSeed } from "../lib/random";
import { buildDreamlikePalette } from "../lib/palettes/dreamlike";
import { buildSkyPalette } from "../lib/palettes/sky";
import { buildDreamlikeField } from "../lib/styles/dreamlike";
import { buildSkyField } from "../lib/styles/sky";

export interface GradientControllerProps {
  initialSeed?: string;
  styleType?: "flower" | "dreamlike" | "sky";
  renderer?: "svg";
  width?: number;
  height?: number;
}

interface LockState {
  palette: boolean; // lock entire palette
  field: boolean; // lock field layout
}

export const GradientController: React.FC<GradientControllerProps> = ({
  initialSeed = "demo",
  styleType = "flower",
  renderer = "svg",
  width = 1200,
  height = 1200,
}) => {
  const [seed, setSeed] = useState(initialSeed);
  const [style, setStyle] = useState<"flower" | "dreamlike" | "sky">(styleType);
  const [lock, setLock] = useState<LockState>({ palette: false, field: false });
  const [manualPalette, setManualPalette] = useState<PaletteSpec | undefined>();
  const [manualField, setManualField] = useState<FieldSpec | undefined>();
  const [lastExportName, setLastExportName] = useState<string | null>(null);
  const [pngScale, setPngScale] = useState(2);
  const [addNoise, setAddNoise] = useState(true);
  const [noiseStrength, setNoiseStrength] = useState(0.25);
  const [exporting, setExporting] = useState(false);
  const [animateMode, setAnimateMode] = useState<
    "none" | "drift" | "pulse" | "parallax"
  >("drift");
  const [mouseInfluence, setMouseInfluence] = useState(0.6);
  const surfaceRef = useRef<GradientSurfaceHandle | null>(null);

  const palette = useMemo(() => {
    if (lock.palette && manualPalette) return manualPalette;
    let p: PaletteSpec;
    if (style === "dreamlike") p = buildDreamlikePalette(seed);
    else if (style === "sky") p = buildSkyPalette(seed);
    else p = buildFlowerPalette(seed);
    if (lock.palette === true && !manualPalette) setManualPalette(p);
    return p;
  }, [seed, lock.palette, manualPalette, style]);

  const field = useMemo(() => {
    if (lock.field && manualField) return manualField;
    let f: FieldSpec;
    if (style === "dreamlike") f = buildDreamlikeField(seed, palette);
    else if (style === "sky") f = buildSkyField(seed, palette);
    else f = buildFlowerField(seed, palette);
    if (lock.field === true && !manualField) setManualField(f);
    return f;
  }, [seed, lock.field, manualField, palette, style]);

  const randomSeed = useCallback(
    (mode: "all" | "unlocked") => {
      if (mode === "all") {
        setSeed(Math.random().toString(36).slice(2, 10));
        setManualPalette(undefined);
        setManualField(undefined);
      } else {
        // change only unlocked aspects: derive sub-seed for unlocked parts
        const base =
          seed +
          "|" +
          Date.now().toString(36) +
          "|" +
          Math.random().toString(36).slice(2, 6);
        if (!lock.palette) setSeed(hashSeed(base + "|p").toString(36));
        else if (!lock.field) setSeed(hashSeed(base + "|f").toString(36));
        else setSeed(hashSeed(base + "|noop").toString(36));
        // keep locked snapshots
        if (!lock.palette) setManualPalette(undefined);
        if (!lock.field) setManualField(undefined);
      }
    },
    [seed, lock]
  );

  function toggleLock(key: keyof LockState) {
    setLock((l) => ({ ...l, [key]: !l[key] }));
    if (key === "palette" && lock.palette) setManualPalette(undefined);
    if (key === "field" && lock.field) setManualField(undefined);
  }

  function changeStyle(s: "flower" | "dreamlike" | "sky") {
    setStyle(s);
    setManualPalette(undefined);
    setManualField(undefined);
  }

  // derive small preview swatches
  const swatches = palette.css.slice(0, 8);

  function doExportSVG() {
    const svg = surfaceRef.current?.exportSVG();
    if (svg)
      triggerDownload(
        new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
        `gradient_${style}_${seed}.svg`
      );
    setLastExportName(`gradient_${style}_${seed}.svg`);
  }
  async function doExportPNG() {
    try {
      setExporting(true);
      const blob = await surfaceRef.current?.exportPNG(pngScale);
      if (blob) {
        const name = `gradient_${style}_${seed}_${pngScale}x.png`;
        triggerDownload(blob, name);
        setLastExportName(name);
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <GradientSurface
        ref={surfaceRef}
        seed={seed}
        styleType={style}
        renderer={renderer}
        width={width}
        height={height}
        palette={palette}
        fieldSpec={field}
        pngScale={pngScale}
        addNoise={addNoise}
        noiseStrength={noiseStrength}
        animateMode={animateMode}
        mouseInfluence={mouseInfluence}
      />
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 340,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={panelStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <strong style={{ fontSize: 14 }}>Gradient Controller</strong>
            <code
              style={{
                fontSize: 11,
                padding: "2px 4px",
                background: "#00000010",
                borderRadius: 4,
              }}
            >
              seed:{seed}
            </code>
            <select
              value={style}
              onChange={(e) => changeStyle(e.target.value as any)}
              style={selectStyle}
            >
              <option value="flower">flower</option>
              <option value="dreamlike">dreamlike</option>
              <option value="sky">sky</option>
            </select>
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            {swatches.map((c, i) => (
              <span
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: c,
                  boxShadow: "0 0 0 1px #00000022 inset",
                }}
              />
            ))}
          </div>
          <div style={row}>
            <button onClick={() => randomSeed("all")} style={btnStyle}>
              🎲 全部
            </button>
            <button onClick={() => randomSeed("unlocked")} style={btnStyle}>
              🎯 未锁
            </button>
          </div>
          <div style={row}>
            <button
              onClick={() => toggleLock("palette")}
              style={{
                ...btnStyle,
                background: lock.palette ? "#ffd54f" : btnStyle.background,
              }}
            >
              {lock.palette ? "🔒 Palette" : "🔓 Palette"}
            </button>
            <button
              onClick={() => toggleLock("field")}
              style={{
                ...btnStyle,
                background: lock.field ? "#ffd54f" : btnStyle.background,
              }}
            >
              {lock.field ? "🔒 Field" : "🔓 Field"}
            </button>
          </div>
          <div style={row}>
            <button
              style={btnStyle}
              onClick={() => navigator.clipboard.writeText(seed.toString())}
            >
              📋 复制
            </button>
            <button
              style={btnStyle}
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("seed", seed.toString());
                window.history.replaceState(null, "", url.toString());
              }}
            >
              🔗 URL
            </button>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginTop: 6,
            }}
          >
            <label style={labelStyle}>
              PNG Scale
              <select
                value={pngScale}
                onChange={(e) => setPngScale(Number(e.target.value))}
                style={selectStyle}
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
                <option value={8}>8x</option>
              </select>
            </label>
            <label style={labelStyle}>
              Noise
              <input
                type="checkbox"
                checked={addNoise}
                onChange={(e) => setAddNoise(e.target.checked)}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={noiseStrength}
                onChange={(e) => setNoiseStrength(Number(e.target.value))}
                disabled={!addNoise}
              />
            </label>
            <label style={labelStyle}>
              Anim
              <select
                value={animateMode}
                onChange={(e) => setAnimateMode(e.target.value as any)}
                style={selectStyle}
              >
                <option value="none">none</option>
                <option value="drift">drift</option>
                <option value="pulse">pulse</option>
                <option value="parallax">parallax</option>
              </select>
            </label>
            <label style={labelStyle}>
              Pointer
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={mouseInfluence}
                onChange={(e) => setMouseInfluence(Number(e.target.value))}
              />
            </label>
            <div style={row}>
              <button
                style={btnStyle}
                onClick={doExportSVG}
                disabled={exporting}
              >
                ⬇️ SVG
              </button>
              <button
                style={btnStyle}
                onClick={doExportPNG}
                disabled={exporting}
              >
                {exporting ? "… 导出中" : "🖼 PNG"}
              </button>
            </div>
            {lastExportName && (
              <div style={{ fontSize: 10, opacity: 0.65 }}>
                Saved: {lastExportName}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  backdropFilter: "blur(10px)",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid #ffffff50",
  padding: 12,
  borderRadius: 14,
  boxShadow: "0 4px 16px -4px rgba(0,0,0,0.25)",
};
const btnStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 8,
  background: "#ffffffb0",
  border: "1px solid #00000022",
  cursor: "pointer",
  backdropFilter: "blur(3px)",
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  alignItems: "center",
};
const labelStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  fontSize: 12,
};
const selectStyle: React.CSSProperties = {
  padding: "4px 6px",
  borderRadius: 6,
  border: "1px solid #0003",
  background: "#fff",
  fontSize: 12,
};

function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
