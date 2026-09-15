import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "../components/DocPage";
import { pageMetadata } from "../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Halalzur — Məxfilik siyasəti",
  description:
    "Halalzur tətbiqinin hansı məlumatları topladığı, necə istifadə etdiyi və istifadəçilərin hüquqları haqqında məxfilik siyasəti.",
  path: "/privacy.html",
});

export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Hüquqi"
      title="Məxfilik siyasəti"
      updated="Son yenilənmə: 28 avqust 2026"
      footerLinks={[
        { href: "/", label: "Ana səhifə" },
        { href: "/pricing.html", label: "Qiymət siyasəti" },
        { href: "/terms.html", label: "İstifadə şərtləri" },
        { href: "/delete-account.html", label: "Hesabı sil" },
      ]}
    >
      <section>
        <h2>Ümumi baxış</h2>
        <p>
          Halalzur məhsulların halal statusunu skan etmək üçün mobil tətbiqdir. Bu səhifə
          tətbiqin hansı məlumatları topladığını, niyə topladığını və istifadəçinin bu
          barədə hansı seçimlərə malik olduğunu izah edir. Halalzur öz halal hökmünü
          vermir — yalnız GIMDES, JAKIM, AZSTANDART Halal kimi tanınan sertifikat
          orqanlarının dərc etdiyi məlumatı göstərir; bu siyasət isə şəxsi məlumatların
          idarə olunmasına aiddir.
        </p>
      </section>

      <section>
        <h2>Hansı məlumatları toplayırıq</h2>
        <div className="data-table">
          <div className="data-row">
            <div className="k">Hesab məlumatı</div>
            <div className="v">Ad və e-poçt (giriş edərkən daxil etdiyiniz və ya Apple ID ilə daxil olduqda Apple-ın paylaşdığı). Cihazınızda saxlanılır.</div>
          </div>
          <div className="data-row">
            <div className="k">Skan tarixçəsi və favoritlər</div>
            <div className="v">Cihazınızda saxlanılır. Apple/Google hesabı ilə daxil olmusunuzsa, cihaz dəyişəndə itməsin deyə serverimizdə də ehtiyat nüsxəsi saxlanılır.</div>
          </div>
          <div className="data-row">
            <div className="k">Kamera</div>
            <div className="v">Yalnız barkodu oxumaq üçün istifadə olunur. Şəkil yalnız naməlum məhsul üçün tərkib siyahısını əl ilə əlavə edərkən, sizin təşəbbüsünüzlə çəkilir.</div>
          </div>
          <div className="data-row">
            <div className="k">İcma təklifləri</div>
            <div className="v">Bazada olmayan məhsulu təklif etdikdə, göndərdiyiniz məlumat (məhsul adı, barkod, tərkib, adınız) təsdiq üçün serverimizdə saxlanılır.</div>
          </div>
          <div className="data-row">
            <div className="k">Bildiriş tokeni</div>
            <div className="v">Bildirişlərə icazə verdikdə, cihazınızın Firebase push tokeni serverimizdə (yalnız icazə üçün) saxlanılır.</div>
          </div>
          <div className="data-row">
            <div className="k">Ödəniş</div>
            <div className="v">Bütün Premium ödənişləri Apple-ın App Store sistemi üzərindən keçir — kart məlumatlarınıza heç vaxt çıxışımız olmur.</div>
          </div>
        </div>
      </section>

      <section>
        <h2>Məlumatları necə istifadə edirik</h2>
        <ul>
          <li>Hesabınızı tanımaq və premium statusunuzu izləmək üçün.</li>
          <li>İcma tərəfindən təklif olunan məhsulları nəzərdən keçirib bazaya əlavə etmək üçün.</li>
          <li>Buraxılış elanları və mühüm yeniliklər üçün bildiriş göndərmək üçün (yalnız icazə verdiyiniz halda).</li>
          <li>Tətbiqi təkmilləşdirmək üçün — heç bir məlumat reklam məqsədilə satılmır və ya üçüncü tərəflərə ötürülmür.</li>
        </ul>
      </section>

      <section>
        <h2>Məlumatı saxlama və silmə</h2>
        <p>
          Cihazda saxlanılan məlumat (tarixçə, favoritlər, hesab) tətbiqi sildikdə avtomatik
          silinir. Serverdə saxlanılan məlumatı (icma təklifləri, xal, bildiriş tokeni) silmək
          istəyirsinizsə, <Link href="/delete-account.html">Hesabı sil</Link> səhifəsindəki
          təlimatları izləyin.
        </p>
      </section>

      <section>
        <h2>Uşaqların məxfiliyi</h2>
        <p>Halalzur 13 yaşdan kiçik uşaqlara yönəldilməyib və onlardan bilərəkdən məlumat toplamır.</p>
      </section>

      <section>
        <h2>Bu siyasətdə dəyişikliklər</h2>
        <p>Bu siyasət yeniləndikdə, &quot;Son yenilənmə&quot; tarixi yuxarıda dəyişdiriləcək.</p>
      </section>

      <section>
        <div className="callout">
          İstifadə etdiyimiz üçüncü tərəf xidmətlər, abunəlik qiymətləri və əlaqə məlumatı üçün{" "}
          <Link href="/pricing.html">Qiymət siyasəti</Link> səhifəsinə baxın.
        </div>
      </section>
    </DocPage>
  );
}
