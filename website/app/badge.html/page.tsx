import type { Metadata } from "next";
import { Suspense } from "react";
import { BadgeClient } from "./BadgeClient";

export const metadata: Metadata = {
  title: "Halalzur nişanı",
  robots: { index: false, follow: false },
};

export default function BadgePage() {
  return (
    <Suspense fallback={null}>
      <BadgeClient />
    </Suspense>
  );
}
