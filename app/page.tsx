import { Suspense } from "react";
import PageClient from "@/components/PageClient";

export default function Page() {
  return (
    <main style={{ height: "100dvh", width: "100vw", position: "relative" }}>
      <Suspense fallback={null}>
        <PageClient />
      </Suspense>
    </main>
  );
}
