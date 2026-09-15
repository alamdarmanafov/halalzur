import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "../components/DocPage";
import { pageMetadata } from "../lib/seo";
import { E_CODES, slugForECode, type ECodeStatus } from "../data/ecodes";

export const metadata: Metadata = pageMetadata({
  title: "E-kod bələdçisi — hər E-kodun halal statusu | Halalzur",
  description: `Qidalarda rast gəlinən ${E_CODES.length} E-kodun (qida əlavəsi) halal statusu, mənşəyi və izahı — Halalzur-un kurasiya etdiyi bazadan.`,
  path: "/e-kod",
});

const STATUS_STYLE: Record<ECodeStatus, string> = {
  halal: "status-ok",
  haram: "status-bad",
  mushbooh: "status-warn",
  depends: "status-neutral",
};

const EXTRA_STYLE = `
  .ecode-index-group { margin-bottom: 8px; }
  .ecode-index-group h3 { font-size: 15px; color: var(--ink); margin-bottom: 10px; }
  .ecode-index-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .ecode-index-chip {
    display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
    border: 1px solid var(--border); border-radius: 10px; padding: 7px 12px; font-size: 13px; color: var(--ink);
  }
  .ecode-index-chip:hover { border-color: var(--brand); }
  .ecode-index-dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
  .ecode-index-dot.status-ok { background: var(--brand); }
  .ecode-index-dot.status-bad { background: #C0362C; }
  .ecode-index-dot.status-warn { background: #E0A82E; }
  .ecode-index-dot.status-neutral { background: var(--ink-muted); }
`;

export default function ECodeIndexPage() {
  const byCategory = new Map<string, typeof E_CODES>();
  for (const entry of E_CODES) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }
  const categories = Array.from(byCategory.keys()).sort();

  return (
    <DocPage
      eyebrow="E-kod bələdçisi"
      title="Bütün E-kodlar"
      lede={`Qidalarda rast gəlinən ${E_CODES.length} E-kodun (qida əlavəsi) halal statusu, mənşəyi və izahı. Kateqoriyaya görə göz gəzdirin və ya birbaşa kod axtarın.`}
      extraStyle={EXTRA_STYLE}
      footerLinks={[
        { href: "/", label: "Ana səhifə" },
        { href: "/pricing.html", label: "Qiymət siyasəti" },
        { href: "/privacy.html", label: "Məxfilik siyasəti" },
        { href: "/terms.html", label: "İstifadə şərtləri" },
      ]}
    >
      {categories.map((category) => (
        <section className="ecode-index-group" key={category}>
          <h3>{category}</h3>
          <div className="ecode-index-grid">
            {byCategory.get(category)!.map((entry) => (
              <Link key={entry.code} href={`/e-kod/${slugForECode(entry.code)}`} className="ecode-index-chip">
                <span className={`ecode-index-dot ${STATUS_STYLE[entry.status]}`} aria-hidden="true" />
                {entry.code}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </DocPage>
  );
}
