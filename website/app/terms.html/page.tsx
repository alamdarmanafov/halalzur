import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "../components/DocPage";
import { pageMetadata } from "../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Halalzur — İstifadə şərtləri",
  description:
    "Halalzur tətbiqindən istifadə qaydalarını, Premium abunəlik şərtlərini və məsuliyyət hüdudlarını izah edən istifadə şərtləri.",
  path: "/terms.html",
});

export default function TermsPage() {
  return (
    <DocPage
      eyebrow="Hüquqi"
      title="İstifadə şərtləri"
      updated="Son yenilənmə: 2 sentyabr 2026"
      footerLinks={[
        { href: "/", label: "Ana səhifə" },
        { href: "/privacy.html", label: "Məxfilik siyasəti" },
        { href: "/pricing.html", label: "Qiymət siyasəti" },
        { href: "/delete-account.html", label: "Hesabı sil" },
      ]}
    >
      <section>
        <h2>Şərtlərin qəbulu</h2>
        <p>
          Halalzur tətbiqini yükləməklə, hesab yaratmaqla və ya istifadə etməklə bu şərtləri
          qəbul etmiş olursunuz. Şərtləri qəbul etmirsinizsə, tətbiqi istifadə etməyin.
        </p>
      </section>

      <section>
        <h2>Xidmətin təsviri</h2>
        <p>
          Halalzur məhsulların halal statusu haqqında məlumatı bir yerə toplayıb göstərən
          tətbiqdir. Göstərilən status GIMDES, JAKIM, AZSTANDART Halal kimi tanınan sertifikat
          orqanlarının dərc etdiyi rəsmi məlumata, Open Food Facts kimi açıq bazalara və ya
          icma tərəfindən təklif edilib Halalzur komandası tərəfindən nəzərdən keçirilmiş
          məlumata əsaslanır. <strong>Halalzur özü dini hökm vermir</strong> — yalnız mövcud
          sertifikat/mənbə məlumatını əks etdirir. Ciddi allergiya, tibbi məhdudiyyət və ya
          şəxsi dini həssaslıq tələb edən hallarda, göstərilən statusdan asılı olmadan
          məhsulun etiketini özünüz yoxlamağı və ya birbaşa istehsalçı/sertifikat orqanı ilə
          əlaqə saxlamağı tövsiyə edirik.
        </p>
      </section>

      <section>
        <h2>Hesab</h2>
        <p>
          Tətbiqdən istifadə üçün e-poçt/şifrə, Apple ID və ya Google hesabı ilə qeydiyyatdan
          keçə bilərsiniz. Hesabınızın təhlükəsizliyinə görə (şifrənizi kiminləsə paylaşmamaq
          daxil olmaqla) siz məsuliyyət daşıyırsınız.
        </p>
      </section>

      <section>
        <h2>Premium abunəlik</h2>
        <p>Limitsiz skan və əlavə funksiyalar App Store vasitəsilə satılan, avtomatik yenilənən abunəlik olaraq təklif olunur.</p>
        <div className="data-table">
          <div className="data-row">
            <div className="k">Planlar</div>
            <div className="v">Aylıq $2.99, 6 aylıq $12.99, illik $19.99 (qiymətlər App Store Connect-də təsdiqlənmiş cari qiymətlərdir).</div>
          </div>
          <div className="data-row">
            <div className="k">Avtomatik yenilənmə</div>
            <div className="v">Cari dövrün bitməsinə ən azı 24 saat qalmış ləğv edilmədiyi təqdirdə, abunəlik eyni müddətə avtomatik yenilənir və Apple ID hesabınızdan ödəniş tutulur.</div>
          </div>
          <div className="data-row">
            <div className="k">Ləğv etmə</div>
            <div className="v">
              iPhone-da <strong>Ayarlar → [adınız] → Abunəliklər</strong> bölməsindən istənilən vaxt ləğv edə bilərsiniz.
            </div>
          </div>
          <div className="data-row">
            <div className="k">Geri ödəniş</div>
            <div className="v">Satın alınmış dövrün istifadə olunmamış hissəsi üçün geri ödəniş edilmir — bunu Apple-ın App Store şərtləri tənzimləyir.</div>
          </div>
        </div>
        <p>
          Ətraflı qiymət məlumatı üçün <Link href="/pricing.html">Qiymət siyasəti</Link> səhifəsinə baxın.
        </p>
      </section>

      <section>
        <h2>İcma təklifləri</h2>
        <p>
          Bazada olmayan məhsulu təklif etdikdə (ad, barkod, tərkib, şəkil daxil olmaqla),
          bu məlumatı Halalzur komandasının nəzərdən keçirib təsdiqlədikdən sonra ictimai
          məlumat bazasında göstərmək üçün Halalzur-a icazə vermiş olursunuz. Yanlış və ya
          aldadıcı məlumat göndərməkdən çəkinin — belə təkliflər rədd edilir və təkrarlanan
          hallarda hesab məhdudlaşdırıla bilər.
        </p>
      </section>

      <section>
        <h2>Qadağan olunan istifadə</h2>
        <ul>
          <li>Tətbiqi qanunsuz məqsədlə, yaxud başqasının hüquqlarını pozan şəkildə istifadə etmək.</li>
          <li>Bilərəkdən yanlış məhsul/sertifikat məlumatı göndərmək.</li>
          <li>Tətbiqin işləməsinə mane olan, avtomatlaşdırılmış (bot) sorğular göndərmək.</li>
          <li>Tətbiqi tərsinə mühəndislik etmək və ya icazəsiz şəkildə kopyalamaq.</li>
        </ul>
      </section>

      <section>
        <h2>Məsuliyyətin hüdudları</h2>
        <p>
          Halalzur məlumatları &quot;olduğu kimi&quot; təqdim edir. Göstərilən statuslar mənbə
          sertifikat orqanlarının və ya icmanın verdiyi məlumata əsaslanır və Halalzur bu
          mənbələrin dəqiqliyinə görə zəmanət vermir. Halalzur, qanunun icazə verdiyi
          maksimum həddə qədər, tətbiqdəki məlumata əsaslanaraq verilən qərarlardan yaranan
          hər hansı zərərə görə məsuliyyət daşımır.
        </p>
      </section>

      <section>
        <h2>Xidmətin dayandırılması</h2>
        <p>
          Bu şərtləri pozan hesabları xəbərdarlıq etmədən məhdudlaşdıra və ya bağlaya bilərik.
          Hesabınızı özünüz silmək istəsəniz, <Link href="/delete-account.html">Hesabı sil</Link>{" "}
          səhifəsindəki təlimatları izləyin.
        </p>
      </section>

      <section>
        <h2>Şərtlərdə dəyişikliklər</h2>
        <p>Bu şərtlər yeniləndikdə, &quot;Son yenilənmə&quot; tarixi yuxarıda dəyişdiriləcək. Tətbiqdən istifadəni davam etdirməyiniz yenilənmiş şərtləri qəbul etdiyiniz mənasına gəlir.</p>
      </section>

      <section>
        <div className="callout">
          Sual və ya tələbləriniz üçün: <a href="mailto:info@bepositive.az">info@bepositive.az</a>. Məxfilik
          təcrübələrimiz üçün <Link href="/privacy.html">Məxfilik siyasəti</Link> səhifəsinə baxın.
        </div>
      </section>
    </DocPage>
  );
}
