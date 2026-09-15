"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const SUPABASE_URL = "https://szizepjcospoygnjmxwz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YSxBg5SQveiZrRU6H65mVg_Ea4gp2Pl";

type StatusKey = "halal" | "mushbooh" | "haram" | "unknown";

const STATUS_LABEL: Record<StatusKey, { emoji: string; text: string; color: string }> = {
  halal: { emoji: "🟢", text: "Halal statusu — Halalzur-da yoxlanılıb", color: "var(--halal)" },
  mushbooh: { emoji: "🟡", text: "Şübhəli status — Halalzur-da yoxlanılıb", color: "var(--mushbooh)" },
  haram: { emoji: "🔴", text: "Tövsiyə edilmir — Halalzur-da yoxlanılıb", color: "var(--haram)" },
  unknown: { emoji: "🟡", text: "Naməlum status — Halalzur-da yoxlanılıb", color: "var(--mushbooh)" },
};

export function BadgeClient() {
  const searchParams = useSearchParams();
  const barcode = (searchParams.get("barcode") || "").trim();

  const [href, setHref] = useState("https://halalzur.com/");
  const [line1, setLine1] = useState("Halalzur ilə yoxla");
  const [line2, setLine2] = useState<{ text: string; statusColor?: string; statusEmoji?: string } | null>({
    text: "Halal sertifikatı skan et",
  });

  useEffect(() => {
    if (!barcode) return;
    setHref(`https://halalzur.com/product.html?barcode=${encodeURIComponent(barcode)}`);

    fetch(
      `${SUPABASE_URL}/rest/v1/certified_entries?select=product_name,brand,status&barcode=eq.${encodeURIComponent(
        barcode
      )}&entry_type=eq.product&deleted_at=is.null&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        const row = rows && rows[0];
        if (!row) return;
        const status = STATUS_LABEL[(row.status as StatusKey) || "unknown"] || STATUS_LABEL.unknown;
        setLine1(row.product_name || row.brand);
        setLine2({ text: status.text.split(" — ")[0], statusColor: status.color, statusEmoji: status.emoji });
      })
      .catch(() => {});
  }, [barcode]);

  return (
    <>
      <style>{`
  :root {
    --ink: #10241A;
    --ink-muted: #52685C;
    --brand-dark: #0A4D2E;
    --brand: #119E4B;
    --border: #DDEFE2;
    --card: #FFFFFF;
    --halal: #119E4B;
    --mushbooh: #B7791F;
    --haram: #C0362C;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    background: transparent;
    font-family: "Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  a.badge {
    display: flex;
    align-items: center;
    gap: 10px;
    width: fit-content;
    max-width: 260px;
    padding: 10px 14px;
    background: var(--card);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    text-decoration: none;
    color: var(--ink);
    box-shadow: 0 2px 10px rgba(10, 77, 46, 0.06);
  }
  a.badge:hover { border-color: var(--brand); }
  .logo { width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0; display: block; }
  .text { min-width: 0; }
  .line1 { font-family: "Manrope", sans-serif; font-weight: 800; font-size: 12.5px; color: var(--brand-dark); white-space: nowrap; }
  .line2 { font-size: 11.5px; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
      `}</style>

      <a className="badge" href={href} target="_blank" rel="noopener">
        <img className="logo" src="/logo.png" alt="Halalzur" />
        <div className="text">
          <div className="line1">{line1}</div>
          <div className="line2">
            {line2?.statusEmoji ? `${line2.statusEmoji} ` : null}
            {line2?.statusColor ? (
              <span style={{ color: line2.statusColor, fontWeight: 600 }}>{line2.text}</span>
            ) : (
              line2?.text
            )}
          </div>
        </div>
      </a>
    </>
  );
}
