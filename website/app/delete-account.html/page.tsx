import type { Metadata } from "next";
import { DocPage } from "../components/DocPage";
import { pageMetadata } from "../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Halalzur — Hesabı sil",
  description: "Halalzur hesabınızı və cihazda/serverdə saxlanılan məlumatlarınızı necə silə biləcəyiniz haqqında təlimat.",
  path: "/delete-account.html",
});

const EXTRA_STYLE = `
  .steps { display: flex; flex-direction: column; gap: 14px; }
  .step-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 20px 22px; display: flex; gap: 16px; align-items: flex-start;
  }
  .step-num {
    flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, var(--brand-dark), var(--brand)); color: #fff;
    font-family: "Manrope", sans-serif; font-weight: 800; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
  }
  .step-card h3 { font-family: "Manrope", sans-serif; font-size: 16px; margin: 0 0 4px; color: var(--ink); }
  .step-card p { font-size: 14.5px; }

  .danger-box {
    background: var(--bad-bg, #FBE7E4); border-radius: 14px; padding: 18px 20px; font-size: 14.5px;
    color: var(--ink); line-height: 1.6;
  }
  .danger-box strong { color: var(--bad, #C0362C); }

  .request-box {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px;
  }
  .request-box p { margin-bottom: 16px; }
  .btn-mail {
    display: inline-flex; align-items: center; gap: 8px; text-decoration: none;
    background: linear-gradient(135deg, var(--brand-dark), var(--brand)); color: #fff;
    font-weight: 700; font-size: 14.5px; padding: 13px 22px; border-radius: 12px;
    font-family: "Source Sans 3", sans-serif;
  }
  .request-box .fine { color: var(--ink-muted); font-size: 13px; margin-top: 14px; line-height: 1.6; }

  :root { --bad: #C0362C; --bad-bg: #FBE7E4; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --bad-bg: #3A1815; }
  }
  :root[data-theme="dark"] { --bad-bg: #3A1815; }
`;

export default function DeleteAccountPage() {
  return (
    <DocPage
      eyebrow="Hesab"
      title="Hesabı və məlumatlarınızı silin"
      lede="Halalzur girişi cihazda saxlanılır — hesab yaratmaq üçün ayrıca server-tərəfli qeydiyyat tələb olunmur. Aşağıda həm cihazınızdakı, həm də bizim serverimizdə saxlanılan məlumatları necə siləcəyiniz izah olunur."
      extraStyle={EXTRA_STYLE}
      footerLinks={[
        { href: "/", label: "Ana səhifə" },
        { href: "/privacy.html", label: "Məxfilik siyasəti" },
        { href: "/terms.html", label: "İstifadə şərtləri" },
        { href: "/pricing.html", label: "Qiymət siyasəti" },
      ]}
    >
      <section>
        <h2>1. Cihazınızdakı məlumatlar</h2>
        <p>
          Skan tarixçəniz və favoritləriniz əsasən telefonunuzda saxlanılır (Apple/Google
          hesabı ilə daxil olmusunuzsa, cihaz dəyişəndə itməsin deyə serverimizdə də ehtiyat
          nüsxəsi saxlanılır — bu, aşağıdakı 2-ci bölmədə təsvir olunan hesab silmə ilə
          serverdən də silinir). Giriş məlumatınız cihazınızda saxlanılır. Bunları silmək üçün:
        </p>
        <div className="steps">
          <div className="step-card">
            <div className="step-num">1</div>
            <div>
              <h3>Tarixçəni təmizləyin</h3>
              <p>
                Tətbiqdə <strong>Profil → Tarixçəni təmizlə</strong> düyməsinə toxunun.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div>
              <h3>Hesabdan çıxın</h3>
              <p>
                Tətbiqdə <strong>Profil → Çıxış et</strong> düyməsinə toxunun — bu, cihazda saxlanılan giriş məlumatınızı (ad, e-poçt) siləcək.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div>
              <h3>Tətbiqi silin</h3>
              <p>Tətbiqi telefonunuzdan silmək qalan bütün lokal məlumatları (favoritlər daxil) həmişəlik siləcək.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>2. Serverimizdə saxlanılan məlumatlar</h2>
        <p>
          Hesab yaratmısınızsa (e-poçt, Apple və ya Google ilə), tətbiq daxilində{" "}
          <strong>bir toxunuşla</strong> hesabınızı və ona bağlı bütün server məlumatlarını
          həmişəlik silə bilərsiniz — ayrıca tələb göndərməyə ehtiyac yoxdur:
        </p>
        <div className="steps">
          <div className="step-card">
            <div className="step-num">1</div>
            <div>
              <h3>Profil → Hesabı sil</h3>
              <p>
                Tətbiqdə <strong>Profil</strong> bölməsinə keçib <strong>Hesabı sil</strong> düyməsinə toxunun və təsdiqləyin.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div>
              <h3>Apple/Google hesabları üçün əlavə addım</h3>
              <p>
                Apple və ya Google ilə daxil olmusunuzsa, cihazınıza bir dəfəlik təsdiq kodu göndərilir (bildiriş formasında) — kodu tətbiqdə daxil etdikdən sonra silinmə dərhal icra olunur. E-poçt hesabları üçün bu addıma ehtiyac yoxdur, silinmə birbaşa baş verir.
              </p>
            </div>
          </div>
        </div>
        <p style={{ marginTop: 4 }}>
          Bu, aşağıdakıları serverimizdən (Supabase) həmişəlik silir: hesab qeydiniz, bildiriş
          tokeni, favoritləriniz, bulud skan tarixçəsi backup-ı (aktiv olduğu hallarda), xal
          məlumatınız, hələ nəzərdən keçirilməmiş icma təklifləriniz və referral əlaqəniz.
          E-poçt hesablarında əsl giriş məlumatınız da (Supabase Auth) silinir.
        </p>
        <div className="request-box">
          <p>Tətbiqə girişiniz yoxdursa (məsələn, cihazı dəyişmisiniz) və ya yuxarıdakı addımlar işləmirsə, aşağıdakı formadan bizə birbaşa müraciət edə bilərsiniz.</p>
          <a
            className="btn-mail"
            href="mailto:info@bepositive.az?subject=Halalzur%20-%20hesab%20məlumatlarımı%20silin&body=Tətbiqdə%20istifadə%20etdiyim%20ad%2Fe-poçt%3A%0ASilinməsini%20istədiyim%20məlumat%3A"
          >
            ✉️ Silinmə tələbi göndər
          </a>
          <p className="fine">Tələbiniz 30 gün ərzində icra ediləcək. Hesabınız Premium abunəliyə malikdirsə, əvvəlcə App Store-dan abunəliyi ləğv etməyi unutmayın — məlumatın silinməsi ödənişi avtomatik dayandırmır.</p>
        </div>
      </section>

      <section>
        <h2>3. Nə silinmir</h2>
        <div className="danger-box">
          <strong>Qeyd:</strong> əgər təklif etdiyiniz məhsul artıq təsdiqlənib bazaya (ictimai
          sertifikat siyahısına) əlavə olunubsa, məhsulun özü (halal statusu, tərkibi) icma
          faydası üçün bazada qala bilər — silinən yalnız sizi həmin qeydlə əlaqələndirən şəxsi
          məlumatdır (adınız, göndərən kimi).
        </div>
      </section>
    </DocPage>
  );
}
