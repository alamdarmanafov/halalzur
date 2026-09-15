import type { Metadata } from "next";
import { DocPage } from "../components/DocPage";
import { pageMetadata } from "../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Halalzur — Qiymət siyasəti",
  description:
    "Halalzur Premium abunəlik qiymətləri, ödəniş və avtomatik yenilənmə şərtləri, istifadə etdiyimiz üçüncü tərəf xidmətlər və əlaqə.",
  path: "/pricing.html",
});

const EXTRA_STYLE = `
  .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  @media (max-width: 640px) { .plans-grid { grid-template-columns: 1fr; } }
  .plan-card {
    border: 1px solid var(--border); border-radius: 16px; padding: 20px; background: var(--surface);
    display: flex; flex-direction: column; gap: 6px;
  }
  .plan-card.featured { border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand); position: relative; }
  .plan-card .tag {
    position: absolute; top: -11px; left: 16px; background: var(--brand); color: #fff;
    font-family: "Manrope", sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 999px;
  }
  .plan-card .name { font-family: "Manrope", sans-serif; font-weight: 700; font-size: 15px; color: var(--ink); }
  .plan-card .price { font-family: "Manrope", sans-serif; font-weight: 800; font-size: 24px; color: var(--ink); margin-top: 4px; }
  .plan-card .price span { font-size: 13px; font-weight: 600; color: var(--ink-muted); }
  .plan-card .note { font-size: 13px; color: var(--ink-muted); margin-top: 2px; }
  .plan-card .save { font-size: 12.5px; color: var(--brand); font-weight: 700; margin-top: 1px; }

  .free-row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    border: 1px dashed var(--border); border-radius: 14px; padding: 16px 18px; background: var(--surface-2);
  }
  .free-row .name { font-weight: 700; color: var(--ink); font-size: 14.5px; }
  .free-row .desc { color: var(--ink-muted); font-size: 14px; margin-top: 2px; }
`;

export default function PricingPage() {
  return (
    <DocPage
      eyebrow="Hüquqi"
      title="Qiymət siyasəti"
      updated="Son yenilənmə: 28 avqust 2026"
      extraStyle={EXTRA_STYLE}
      footerLinks={[
        { href: "/", label: "Ana səhifə" },
        { href: "/privacy.html", label: "Məxfilik siyasəti" },
        { href: "/terms.html", label: "İstifadə şərtləri" },
        { href: "/delete-account.html", label: "Hesabı sil" },
      ]}
    >
      <section>
        <h2>Pulsuz plan</h2>
        <div className="free-row">
          <div>
            <div className="name">Pulsuz</div>
            <div className="desc">Gündə 3 skan, əsas halal statusu göstərilir</div>
          </div>
        </div>
      </section>

      <section>
        <h2>Premium abunəlik planları</h2>
        <p>Limitsiz skan və tam sertifikat detalları. Bütün planlar App Store vasitəsilə, avtomatik yenilənən abunəlik olaraq satılır.</p>
        {/* Savings % below are (1 − planPrice / (monthlyPrice × months)) rounded —
            recompute by hand if any of the three prices above change, since
            this is a static content block with no automatic derivation. */}
        <div className="plans-grid">
          <div className="plan-card">
            <div className="name">Aylıq</div>
            <div className="price">
              $2.99<span> / ay</span>
            </div>
            <div className="note">Hər ay yenilənir</div>
          </div>
          <div className="plan-card featured">
            <span className="tag">Ən sərfəli</span>
            <div className="name">İllik</div>
            <div className="price">
              $19.99<span> / il</span>
            </div>
            <div className="note">Ayda ~$1.67-yə bərabər</div>
            <div className="save">Aylıq plana görə 44% qənaət</div>
          </div>
          <div className="plan-card">
            <div className="name">6 aylıq</div>
            <div className="price">
              $12.99<span> / 6 ay</span>
            </div>
            <div className="note">Hər 6 ayda yenilənir</div>
            <div className="save">Aylıq plana görə 28% qənaət</div>
          </div>
        </div>
      </section>

      <section>
        <h2>Ödəniş və avtomatik yenilənmə</h2>
        <ul>
          <li>Ödəniş Apple ID hesabınızdan, satın alma zamanı seçdiyiniz plana uyğun olaraq tutulur.</li>
          <li>Abunəlik cari dövrün bitməsinə ən azı 24 saat qalmış ləğv edilmədiyi təqdirdə, eyni müddətə avtomatik yenilənir və Apple ID hesabınızdan ödəniş tutulur.</li>
          <li>
            Abunəliyi idarə etmək və ya ləğv etmək üçün: iPhone-da <strong>Ayarlar → [adınız] → Abunəliklər</strong>.
          </li>
          <li>Satın alınmış abunəlik müddətinin istifadə olunmamış hissəsi üçün geri ödəniş edilmir (bunu Apple-ın App Store şərtləri tənzimləyir).</li>
        </ul>
      </section>

      <section>
        <h2>Üçüncü tərəf xidmətlər</h2>
        <p>Halalzur aşağıdakı xidmətlərdən istifadə edir, hər biri öz məxfilik siyasətinə tabedir:</p>
        <div className="data-table">
          <div className="data-row">
            <div className="k">Apple</div>
            <div className="v">Apple ID ilə giriş və App Store ödənişləri — bütün Premium abunəlik ödənişləri Apple-ın sistemi üzərindən keçir.</div>
          </div>
          <div className="data-row">
            <div className="k">Supabase</div>
            <div className="v">Verilənlər bazası — icma məhsul təklifləri, xal, bildiriş tokenləri.</div>
          </div>
          <div className="data-row">
            <div className="k">Google</div>
            <div className="v">Google hesabı ilə giriş və Firebase Cloud Messaging vasitəsilə push bildirişlərinin çatdırılması.</div>
          </div>
        </div>
      </section>

      <section>
        <h2>Əlaqə</h2>
        <div className="callout">
          Qiymətlər, abunəlik və ya digər sual/tələbləriniz üçün: <a href="mailto:info@bepositive.az">info@bepositive.az</a>
        </div>
      </section>
    </DocPage>
  );
}
