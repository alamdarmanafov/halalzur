import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductClient } from "./ProductClient";

export const metadata: Metadata = {
  title: "Halalzur — Məhsul",
  description: "Halalzur ilə bu məhsulun halal statusunu yoxla.",
  robots: { index: false, follow: false },
};

export default function ProductPage() {
  return (
    <Suspense fallback={null}>
      <ProductClient />
    </Suspense>
  );
}
