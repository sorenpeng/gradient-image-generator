"use client";
import { useSearchParams } from "next/navigation";
import { GradientController } from "@/components/GradientController";

export default function PageClient() {
  const sp = useSearchParams();
  const seed = sp.get("seed") || "demo";
  return <GradientController initialSeed={seed} />;
}
