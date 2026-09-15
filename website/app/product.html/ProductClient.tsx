"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// PLACEHOLDER — replace once Halalzur is published, same as the homepage's
// nav/hero/cta store links.
const APP_STORE_URL = "#";

const SUPABASE_URL = "https://szizepjcospoygnjmxwz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YSxBg5SQveiZrRU6H65mVg_Ea4gp2Pl";

type StatusKey = "halal" | "mushbooh" | "haram" | "unknown";

const STATUS_LABEL: Record<StatusKey, { emoji: string; text: string; cls: string }> = {
  halal: { emoji: "🟢", text: "Halal", cls: "status-halal" },
  mushbooh: { emoji: "🟡", text: "Şübhəli", cls: "status-mushbooh" },
  haram: { emoji: "🔴", text: "Tövsiyə edilmir", cls: "status-haram" },
  unknown: { emoji: "🟡", text: "Naməlum", cls: "status-unknown" },
};

type Row = { product_name: string | null; brand: string | null; status: string | null };

type State =
  | { kind: "no-barcode" }
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error" }
  | { kind: "found"; row: Row };

function Buttons({ barcode }: { barcode: string }) {
  const openAppHref = `halalzur://product/${encodeURIComponent(barcode)}`;
  return (
    <div className="btn-row">
      <a className="primary-btn" href={openAppHref}>
        Tətbiqdə aç
      </a>
      <a className="secondary-btn" href={APP_STORE_URL}>
        Halalzur-u yüklə
      </a>
    </div>
  );
}

export function ProductClient() {
  const searchParams = useSearchParams();
  const barcode = (searchParams.get("barcode") || "").trim();
  const [state, setState] = useState<State>(barcode ? { kind: "loading" } : { kind: "no-barcode" });

  useEffect(() => {
    if (!barcode) {
      setState({ kind: "no-barcode" });
      return;
    }
    setState({ kind: "loading" });
    fetch(
      `${SUPABASE_URL}/rest/v1/certified_entries?select=product_name,brand,status&barcode=eq.${encodeURIComponent(
        barcode
      )}&entry_type=eq.product&deleted_at=is.null&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Row[]) => {
        const row = rows && rows[0];
        setState(row ? { kind: "found", row } : { kind: "not-found" });
      })
      .catch(() => setState({ kind: "error" }));
  }, [barcode]);

  let content: React.ReactNode;
  if (state.kind === "no-barcode") {
    content = (
      <>
        <h1>Barkod göstərilməyib</h1>
        <p className="lede">Bu linkdə barkod məlumatı yoxdur.</p>
        <Buttons barcode="" />
      </>
    );
  } else if (state.kind === "loading") {
    content = <p className="loading">Yüklənir…</p>;
  } else if (state.kind === "not-found") {
    content = (
      <>
        <h1>Bu məhsul hələ bazamızda yoxdur</h1>
        <p className="lede">Tətbiqdə skan edərək əlavə edə bilərsiniz.</p>
        <Buttons barcode={barcode} />
      </>
    );
  } else if (state.kind === "error") {
    content = (
      <>
        <h1>Yüklənmədi</h1>
        <p className="lede">Bir xəta baş verdi, tətbiqdə birbaşa yoxlaya bilərsiniz.</p>
        <Buttons barcode={barcode} />
      </>
    );
  } else {
    const status = STATUS_LABEL[(state.row.status as StatusKey) || "unknown"] || STATUS_LABEL.unknown;
    content = (
      <>
        <h1>{state.row.product_name || state.row.brand}</h1>
        <div className="brand-line">{state.row.brand}</div>
        <div className={`status-pill ${status.cls}`}>
          {status.emoji} {status.text}
        </div>
        <p className="lede">Tam sertifikat məlumatı, tərkib analizi və halal alternativlər üçün tətbiqdə aç.</p>
        <Buttons barcode={barcode} />
      </>
    );
  }

  return (
    <>
      <style>{`
  :root {
    --bg: #F6FBF7;
    --ink: #10241A;
    --ink-muted: #52685C;
    --brand-dark: #0A4D2E;
    --brand: #119E4B;
    --brand-accent: #7CFC00;
    --brand-surface: #E8F7ED;
    --card: #FFFFFF;
    --border: #DDEFE2;
    --halal: #119E4B;
    --mushbooh: #B7791F;
    --mushbooh-bg: #FBF3DF;
    --haram: #C0362C;
    --haram-bg: #FBE7E5;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #0B1712;
      --ink: #EAF3EC;
      --ink-muted: #8FA79A;
      --card: #112420;
      --border: #1C3A2E;
      --brand-surface: #10281F;
    }
  }
  :root[data-theme="dark"] {
    --bg: #0B1712;
    --ink: #EAF3EC;
    --ink-muted: #8FA79A;
    --card: #112420;
    --border: #1C3A2E;
    --brand-surface: #10281F;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: "Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  h1, h2 { font-family: "Manrope", sans-serif; text-wrap: balance; margin: 0; }
  .card {
    width: 100%;
    max-width: 420px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 36px 28px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(10, 77, 46, 0.08);
  }
  .logo {
    width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 18px;
    display: block; object-fit: cover;
  }
  .eyebrow {
    display: inline-block; font-size: 12.5px; font-weight: 700; letter-spacing: 0.04em;
    color: var(--brand-dark); background: var(--brand-surface); padding: 5px 12px; border-radius: 999px;
    margin-bottom: 14px;
  }
  h1 { font-size: 22px; line-height: 1.3; color: var(--ink); }
  .brand-line { color: var(--ink-muted); font-size: 14px; margin-top: 6px; }
  .status-pill {
    display: inline-flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13.5px;
    padding: 7px 16px; border-radius: 999px; margin: 16px 0;
  }
  .status-halal { background: var(--brand-surface); color: var(--halal); }
  .status-mushbooh { background: var(--mushbooh-bg); color: var(--mushbooh); }
  .status-haram { background: var(--haram-bg); color: var(--haram); }
  .status-unknown { background: var(--mushbooh-bg); color: var(--mushbooh); }
  .lede { color: var(--ink-muted); font-size: 15px; line-height: 1.55; margin: 4px 0 24px; }
  .btn-row { display: flex; flex-direction: column; gap: 10px; }
  .primary-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: var(--brand-dark); color: #fff; text-decoration: none;
    font-weight: 700; font-size: 15px; padding: 14px 20px; border-radius: 14px; font-family: inherit;
  }
  .secondary-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: transparent; color: var(--brand-dark); text-decoration: none; border: 1.5px solid var(--border);
    font-weight: 700; font-size: 14px; padding: 12px 20px; border-radius: 14px;
  }
  .loading { color: var(--ink-muted); font-size: 14px; padding: 20px 0; }
      `}</style>

      <div className="card">
        <img className="logo" src="/logo.png" alt="Halalzur" />
        <div className="eyebrow">HALAL STATUSU</div>
        <div>{content}</div>
      </div>
    </>
  );
}
