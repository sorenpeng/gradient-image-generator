"use client";
import { useSearchParams } from "next/navigation";
import { GradientController } from "@/components/GradientController";

export default function Page() {
  const sp = useSearchParams();
  const seed = sp.get("seed") || "demo";
  return (
    <main style={{ height: "100dvh", width: "100vw", position: "relative" }}>
      <GradientController initialSeed={seed} />
    </main>
  );
}
