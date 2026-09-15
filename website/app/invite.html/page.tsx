import type { Metadata } from "next";
import { Suspense } from "react";
import { InviteClient } from "./InviteClient";

export const metadata: Metadata = {
  title: "Halalzur — Dəvət",
  description: "Halalzur-a dəvət olundunuz — barkoddan halal statusunu yoxlayan tətbiq.",
  robots: { index: false, follow: false },
};

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InviteClient />
    </Suspense>
  );
}
