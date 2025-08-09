"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { buildFlowerPalette, PaletteSpec } from "../lib/palettes/flower";
import { buildFlowerField, FieldSpec } from "../lib/styles/flower";
import { GradientSurface } from "./GradientSurface";
import { hashSeed } from "../lib/random";

export interface GradientControllerProps {
  initialSeed?: string;
  styleType?: "flower";
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
  const [lock, setLock] = useState<LockState>({ palette: false, field: false });
  const [manualPalette, setManualPalette] = useState<PaletteSpec | undefined>();
  const [manualField, setManualField] = useState<FieldSpec | undefined>();
  const [lastExportName, setLastExportName] = useState<string | null>(null);

  const palette = useMemo(() => {
    if (lock.palette && manualPalette) return manualPalette;
    const p = buildFlowerPalette(seed);
    if (lock.palette === true && !manualPalette) setManualPalette(p);
    return p;
  }, [seed, lock.palette, manualPalette]);

  const field = useMemo(() => {
    if (lock.field && manualField) return manualField;
    const f = buildFlowerField(seed, palette);
    if (lock.field === true && !manualField) setManualField(f);
    return f;
  }, [seed, lock.field, manualField, palette]);

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

  // derive small preview swatches
  const swatches = palette.css.slice(0, 8);

  function handleExportSVG(svgText: string) {
    const name = `gradient_${styleType}_${seed}.svg`;
    triggerDownload(
      new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }),
      name
    );
    setLastExportName(name);
  }
  function handleExportPNG(blob: Blob) {
    const name = `gradient_${styleType}_${seed}.png`;
    triggerDownload(blob, name);
    setLastExportName(name);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <GradientSurface
        seed={seed}
        styleType={styleType}
        renderer={renderer}
        width={width}
        height={height}
        palette={palette}
        fieldSpec={field}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        pngScale={2}
      />
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 280,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            backdropFilter: "blur(10px)",
            background: "rgba(255,255,255,0.55)",
            border: "1px solid #ffffff50",
            padding: 12,
            borderRadius: 14,
            boxShadow: "0 4px 16px -4px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => randomSeed("all")}
                style={btnStyle}
                title="完全随机所有参数"
              >
                🎲 全部随机
              </button>
              <button
                onClick={() => randomSeed("unlocked")}
                style={btnStyle}
                title="只随机未锁定参数"
              >
                🎯 未锁定
              </button>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => toggleLock("palette")}
                style={{
                  ...btnStyle,
                  background: lock.palette ? "#ffd54f" : btnStyle.background,
                }}
                title="锁定/解锁调色板"
              >
                {lock.palette ? "🔒 Palette" : "🔓 Palette"}
              </button>
              <button
                onClick={() => toggleLock("field")}
                style={{
                  ...btnStyle,
                  background: lock.field ? "#ffd54f" : btnStyle.background,
                }}
                title="锁定/解锁形态"
              >
                {lock.field ? "🔒 Field" : "🔓 Field"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                style={btnStyle}
                onClick={() => navigator.clipboard.writeText(seed.toString())}
              >
                📋 复制 seed
              </button>
              <button
                style={btnStyle}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("seed", seed.toString());
                  window.history.replaceState(null, "", url.toString());
                }}
              >
                🔗 更新URL
              </button>
              <button
                style={btnStyle}
                onClick={() => {
                  const evt = new Event("request-export-svg");
                }}
              >
                ⬇️ SVG
              </button>
              <button
                style={btnStyle}
                onClick={() => {
                  const evt = new Event("request-export-png");
                }}
              >
                🖼 PNG
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

function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
