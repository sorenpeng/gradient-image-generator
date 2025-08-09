"use client";
import GradientBG from "@/components/GradientBG";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const sp = useSearchParams();
  const seed = sp.get("seed") || "mvp";
  return (
    <main style={{ height: "100dvh", width: "100vw" }}>
      <GradientBG seed={seed} layers={4} inertia={0.87} quality="high" />
      <div className="hero">
        <h1>Layered SVG Radial Gradients</h1>
        <p>
          Move your mouse / touch to explore. Add <code>?seed=xxxxx</code> to
          share.
        </p>
      </div>
    </main>
  );
}
