"use client";
import { useSearchParams } from "next/navigation";
import { GradientSurface } from "@/components/GradientSurface";

export default function Page() {
  const sp = useSearchParams();
  const seed = sp.get("seed") || "demo";
  return (
    <main style={{ height: "100dvh", width: "100vw", position: "relative" }}>
      {/* New unified surface */}
      <GradientSurface
        seed={seed}
        styleType="flower"
        renderer="svg"
        width={1200}
        height={1200}
      />
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          background: "rgba(255,255,255,0.55)",
          padding: "10px 14px",
          borderRadius: 12,
          backdropFilter: "blur(8px)",
        }}
      >
        <h1 style={{ fontSize: 18, margin: 0 }}>
          Gradient Generator (Flower / SVG)
        </h1>
        <p
          style={{
            fontSize: 12,
            margin: "4px 0 0",
            maxWidth: 320,
          }}
        >
          Seed: <code>{seed}</code> · Add ?seed=xxxx to URL to reproduce.
        </p>
      </div>
    </main>
  );
}
