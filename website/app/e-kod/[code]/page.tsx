import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DocPage } from "../../components/DocPage";
import { pageMetadata } from "../../lib/seo";
import { E_CODES, ECODE_STATUS_LABEL, findECode, slugForECode, type ECodeStatus } from "../../data/ecodes";
import { APP_STORE_URL } from "../../data/appStore";

export function generateStaticParams() {
  return E_CODES.map((e) => ({ code: slugForECode(e.code) }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const entry = findECode(code);
  if (!entry) return {};
  const statusLabel = ECODE_STATUS_LABEL[entry.status];
  const title = `${entry.code} nədir, halaldırmı? — ${entry.name} | Halalzur`;
  const description = `${entry.code} (${entry.name}): ${statusLabel}. ${entry.note}`.slice(0, 165);
  return pageMetadata({ title, description, path: `/e-kod/${slugForECode(entry.code)}` });
}

const STATUS_STYLE: Record<ECodeStatus, string> = {
  halal: "status-ok",
  haram: "status-bad",
  mushbooh: "status-warn",
  depends: "status-neutral",
};

const EXTRA_STYLE = `
  .ecode-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
  .ecode-badge {
    font-family: "Manrope", sans-serif; font-weight: 800; font-size: 12.5px;
    padding: 6px 14px; border-radius: 999px;
  }
  .ecode-badge.status-ok { background: var(--brand-surface); color: var(--brand-dark); }
  .ecode-badge.status-bad { background: rgba(192,54,44,0.12); color: #C0362C; }
  .ecode-badge.status-warn { background: rgba(245,196,81,0.22); color: #92650a; }
  .ecode-badge.status-neutral { background: var(--surface-2); color: var(--ink-muted); }
  .ecode-category { color: var(--ink-muted); font-size: 13.5px; }
  .ecode-related { display: flex; flex-wrap: wrap; gap: 8px; }
  .ecode-related a {
    display: inline-block; border: 1px solid var(--border); border-radius: 10px;
    padding: 6px 12px; font-size: 13px; text-decoration: none; color: var(--ink);
  }
  .ecode-related a:hover { border-color: var(--brand); }
`;

export default async function ECodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const entry = findECode(code);
  if (!entry) notFound();

  const related = E_CODES.filter((e) => e.category === entry.category && e.code !== entry.code).slice(0, 8);

  return (
    <DocPage
      eyebrow="E-kod bələdçisi"
      title={`${entry.code} — ${entry.name}`}
      extraStyle={EXTRA_STYLE}
      footerLinks={[
        { href: "/", label: "Ana səhifə" },
        { href: "/pricing.html", label: "Qiymət siyasəti" },
        { href: "/privacy.html", label: "Məxfilik siyasəti" },
        { href: "/terms.html", label: "İstifadə şərtləri" },
      ]}
    >
      <section>
        <div className="ecode-head">
          <span className={`ecode-badge ${STATUS_STYLE[entry.status]}`}>{ECODE_STATUS_LABEL[entry.status]}</span>
          <span className="ecode-category">{entry.category}</span>
        </div>
        <p>{entry.note}</p>
      </section>

      <section>
        <h2>Bu qiymətləndirmə haradan gəlir?</h2>
        <p>
          Halalzur öz halal hökmünü vermir — {entry.code} üçün göstərilən status Halalzur-un kurasiya etdiyi E-kod
          bazasından götürülüb və konkret sertifikat orqanlarının dərc etdiyi təsnifata əsaslanır. Məhsulun öz
          tərkib siyahısında bu kodu görəndə, Halalzur tətbiqi ilə skan edərək məhsulun tam halal statusunu və
          bütün digər tərkib hissələrinin izahını bir yerdə görə bilərsiniz.
        </p>
        <div className="callout">
          <Link href={APP_STORE_URL}>Halalzur-u yükləyin</Link> və barkodu skan edərək bu məhsulun tam nəticəsini görün.
        </div>
      </section>

      {related.length > 0 ? (
        <section>
          <h2>Eyni kateqoriyadan digər E-kodlar</h2>
          <div className="ecode-related">
            {related.map((r) => (
              <Link key={r.code} href={`/e-kod/${slugForECode(r.code)}`}>
                {r.code}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </DocPage>
  );
}
