import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "./components/Reveal";
import { HeroPhoneSlider } from "./components/HeroPhoneSlider";
import { CompareSlider } from "./components/CompareSlider";
import { FaqAccordion } from "./components/FaqAccordion";

const CERTIFIERS = [
  { name: "GIMDES", country: "Türkiyə" },
  { name: "HAK", country: "Türkiyə" },
  { name: "SMIIC", country: "Beynəlxalq" },
  { name: "JAKIM", country: "Malaziya" },
  { name: "AZSTANDART Halal", country: "Azərbaycan" },
];

function stagger(i: number): React.CSSProperties {
  return { ["--i" as string]: i } as React.CSSProperties;
}

// PLACEHOLDER — set this to the real App Store listing URL once Halalzur
// is published (App Store Connect → App → App Store tab → "View on
// App Store" link, format https://apps.apple.com/az/app/halalzur/idXXXXXXXXXX),
// then every download button on the page picks it up automatically.
const APP_STORE_URL = "#";

const TITLE = "Halalzur — Halal sertifikatı skan et";
const DESCRIPTION =
  "Məhsulun barkodunu skan et, halal statusunu GIMDES, JAKIM, AZSTANDART Halal kimi tanınan sertifikat orqanlarına əsasən dərhal öyrən.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://halalzur.com/" },
  openGraph: {
    type: "website",
    siteName: "Halalzur",
    locale: "az_AZ",
    url: "https://halalzur.com/",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "https://halalzur.com/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["https://halalzur.com/og-image.jpg"],
  },
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Halalzur",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "iOS",
  url: "https://halalzur.com/",
  description: DESCRIPTION,
  image: "https://halalzur.com/logo.png",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Pulsuz plan — gündə 3 skan",
  },
};

// Tells Google which image is the official brand logo (the "Logo" rich
// result shown when someone searches "Halalzur" by name) — the favicon
// link in the root layout is a separate, smaller signal Google uses for
// the little icon next to search result links. Needs Google to re-crawl/
// re-index the page before it shows up; requesting indexing in Search
// Console speeds that up but doesn't make it instant.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Halalzur",
  url: "https://halalzur.com/",
  logo: "https://halalzur.com/logo.png",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <style>{`
  :root {
    --bg: #F6FAF7;
    --surface: #FFFFFF;
    --surface-2: #EEF6F1;
    --ink: #10241A;
    --ink-muted: #52685C;
    --border: #E1EAE4;

    --brand-dark: #0A4D2E;
    --brand: #119E4B;
    --brand-accent: #7CFC00;
    --brand-surface: #E8F7ED;
    --white: #FFFFFF;

    --shadow-color: 16, 36, 26;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #081911;
      --surface: #0F1F17;
      --surface-2: #142B20;
      --ink: #EAF3EC;
      --ink-muted: #8FA79A;
      --border: #1E3327;
      --shadow-color: 0, 0, 0;
    }
  }
  :root[data-theme="dark"] {
    --bg: #081911;
    --surface: #0F1F17;
    --surface-2: #142B20;
    --ink: #EAF3EC;
    --ink-muted: #8FA79A;
    --border: #1E3327;
    --shadow-color: 0, 0, 0;
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: "Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  h1, h2, h3 { font-family: "Manrope", sans-serif; text-wrap: balance; margin: 0; }
  p { margin: 0; }
  a { color: inherit; }
  img { max-width: 100%; }
  .wrap { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
  section { overflow-x: hidden; }

  /* ---- nav ---- */
  header.nav {
    position: sticky; top: 0; z-index: 40;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .nav-row { display: flex; align-items: center; justify-content: space-between; height: 72px; }
  .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .brand-name { font-family: "Manrope", sans-serif; font-weight: 800; font-size: 19px; color: var(--ink); }
  .brand-name span { color: var(--brand); }
  .nav-links { display: flex; align-items: center; gap: 32px; list-style: none; margin: 0; padding: 0; }
  .nav-links a {
    text-decoration: none; color: var(--ink-muted); font-weight: 600; font-size: 14.5px;
  }
  .nav-links a:hover { color: var(--ink); }
  .nav-cta {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--brand); color: #fff; text-decoration: none;
    font-weight: 700; font-size: 14px; padding: 10px 18px; border-radius: 999px;
    box-shadow: 0 6px 16px -6px rgba(10,77,46,0.5);
  }
  .nav-mobile-hide { display: flex; }
  @media (max-width: 760px) { .nav-links { display: none; } }

  /* ---- hero ---- */
  .hero { position: relative; padding: 72px 0 56px; }
  .hero-blob {
    position: absolute; top: -120px; right: -160px; width: 560px; height: 560px;
    background: radial-gradient(circle, var(--brand-accent) 0%, transparent 68%);
    opacity: 0.25; filter: blur(10px); pointer-events: none;
  }
  .hero-grid {
    position: relative; display: grid; grid-template-columns: 1.05fr 0.85fr;
    gap: 48px; align-items: center;
  }
  @media (max-width: 900px) { .hero-grid { grid-template-columns: 1fr; } }

  .eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: "Manrope", sans-serif; font-weight: 700; font-size: 12px;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--brand-dark); background: var(--brand-surface);
    padding: 7px 14px; border-radius: 999px; margin-bottom: 20px;
  }
  .eyebrow::before { content: "●"; color: var(--brand-accent); font-size: 8px; }

  .hero h1 { font-size: clamp(34px, 5vw, 54px); line-height: 1.08; letter-spacing: -0.01em; }
  .hero h1 .accent { color: var(--brand); }
  .hero .lede {
    font-size: 18px; line-height: 1.6; color: var(--ink-muted);
    margin-top: 20px; max-width: 46ch;
  }
  .hero-actions { display: flex; gap: 14px; margin-top: 32px; flex-wrap: wrap; }
  .btn-primary, .btn-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: "Source Sans 3", sans-serif; font-weight: 700; font-size: 15px;
    padding: 15px 26px; border-radius: 14px; text-decoration: none; cursor: pointer;
    border: none;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--brand-dark), var(--brand));
    color: #fff; box-shadow: 0 10px 24px -10px rgba(10,77,46,0.55);
  }
  .btn-secondary {
    background: var(--surface); color: var(--ink); border: 1.5px solid var(--border);
  }

  .trust-strip { margin-top: 44px; }
  .trust-label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted); font-weight: 700; margin-bottom: 12px; }
  .trust-logos { display: flex; flex-wrap: wrap; gap: 10px; }
  .trust-chip {
    font-size: 13px; font-weight: 700; color: var(--brand-dark);
    background: var(--brand-surface); padding: 8px 14px; border-radius: 999px;
  }

  /* ---- phone mockup ---- */
  .phone-wrap { display: flex; justify-content: center; }
  .phone {
    width: 272px; height: 552px; border-radius: 42px; background: #0c1512;
    padding: 9px; box-shadow: 0 40px 70px -30px rgba(var(--shadow-color), 0.5), 0 10px 24px -10px rgba(var(--shadow-color), 0.4);
    position: relative;
  }
  .phone .notch { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); width: 86px; height: 22px; background: #0c1512; border-radius: 14px; z-index: 5; }
  .phone .screen {
    width: 100%; height: 100%; border-radius: 33px; overflow: hidden; position: relative;
    background: radial-gradient(120% 90% at 20% 15%, #24493a 0%, #0d1912 55%, #05100b 100%);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .phone .top-bar { position: absolute; top: 0; left: 0; right: 0; padding: 38px 18px 16px; background: linear-gradient(180deg, rgba(10,77,46,0.92), transparent); z-index: 4; }
  .phone .top-bar .row { display: flex; align-items: center; justify-content: space-between; }
  .phone .top-bar .brand-row { display: flex; align-items: center; gap: 8px; }
  .phone .top-bar .brand-row b { color: #fff; font-family: "Manrope", sans-serif; font-size: 16px; }
  .phone .bell { color: rgba(255,255,255,0.85); font-size: 16px; }
  .phone .hint { color: rgba(255,255,255,0.85); font-size: 12px; margin-top: 4px; }
  .phone .frame {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -55%);
    width: 172px; height: 104px; border: 2.5px solid var(--brand-accent); border-radius: 16px;
    box-shadow: 0 0 0 999px rgba(4,10,7,0.35); z-index: 3;
  }
  .phone .bottom-bar { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 18px 24px; background: linear-gradient(0deg, rgba(10,77,46,0.92), transparent); text-align: center; z-index: 4; }
  .phone .cta-pill { display: inline-block; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.35); color: #fff; font-size: 12.5px; font-weight: 700; padding: 9px 20px; border-radius: 999px; }

  /* ---- sections ---- */
  .section { padding: 88px 0; }
  .section-head { max-width: 640px; margin: 0 auto 48px; text-align: center; }
  .section-head h2 { font-size: clamp(26px, 3.4vw, 36px); }
  .section-head p { color: var(--ink-muted); font-size: 16.5px; margin-top: 14px; line-height: 1.6; }

  .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr; } }
  .feature-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 20px;
    padding: 26px 22px; transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .feature-card:hover {
    transform: translateY(-4px);
    border-color: var(--brand);
    box-shadow: 0 16px 32px -20px rgba(var(--shadow-color), 0.35);
  }
  .feature-icon {
    width: 44px; height: 44px; border-radius: 12px; background: var(--brand-surface);
    display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
    font-size: 20px;
  }
  .feature-card h3 { font-size: 17px; margin-bottom: 8px; }
  .feature-card p { color: var(--ink-muted); font-size: 14.5px; line-height: 1.55; }

  .steps { background: var(--surface-2); }
  .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; position: relative; }
  @media (max-width: 800px) { .steps-grid { grid-template-columns: 1fr; } }
  .step { position: relative; }
  .step-num {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--brand-dark), var(--brand));
    color: #fff; font-family: "Manrope", sans-serif; font-weight: 800; font-size: 16px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
  }
  .step h3 { font-size: 18px; margin-bottom: 8px; }
  .step p { color: var(--ink-muted); font-size: 14.5px; line-height: 1.55; }

  .certifiers-band { text-align: center; }
  .certifiers-track-wrap {
    margin-top: 32px; overflow: hidden;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  }
  .certifiers-track {
    display: flex; gap: 14px; width: max-content;
    animation: certifiers-marquee 26s linear infinite;
  }
  .certifiers-track-wrap:hover .certifiers-track { animation-play-state: paused; }
  @keyframes certifiers-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  .certifier-pill {
    border: 1.5px solid var(--border); border-radius: 14px; padding: 14px 20px;
    background: var(--surface); min-width: 140px; flex: none;
    transition: transform 0.25s ease, border-color 0.25s ease;
  }
  .certifier-pill:hover { transform: translateY(-3px); border-color: var(--brand); }
  .certifier-pill b { display: block; font-family: "Manrope", sans-serif; font-size: 15px; color: var(--ink); }
  .certifier-pill span { display: block; font-size: 12px; color: var(--ink-muted); margin-top: 3px; }

  /* ---- before/after compare slider ---- */
  .compare { margin-top: 8px; }
  .compare-summary { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .result-overall-badge { font-family: "Manrope", sans-serif; font-weight: 800; font-size: 12px; padding: 5px 12px; border-radius: 999px; }
  .result-overall-badge.status-warn { background: rgba(245,196,81,0.22); color: #92650a; }
  .result-overall-badge.status-ok { background: var(--brand-surface); color: var(--brand-dark); }
  .result-overall-name { font-family: "Manrope", sans-serif; font-weight: 800; font-size: 16px; color: var(--ink); }
  .compare-frame-wrap { position: relative; }
  .compare-frame {
    position: relative; height: 300px; border-radius: 20px; overflow: hidden;
    border: 1px solid var(--border); background: var(--surface); user-select: none;
  }
  .compare-pane { position: absolute; inset: 0; padding: 52px 26px 24px; display: flex; flex-direction: column; }
  .compare-after { background: linear-gradient(135deg, var(--brand-dark), var(--brand)); color: #fff; }
  .compare-before { background: var(--surface-2); }
  .compare-label {
    position: absolute; top: 16px; font-family: "Manrope", sans-serif; font-weight: 800; font-size: 11px;
    letter-spacing: 0.05em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px;
  }
  .compare-label-after { right: 16px; background: rgba(255,255,255,0.18); color: #fff; }
  .compare-label-before { left: 16px; background: var(--surface); color: var(--ink-muted); border: 1px solid var(--border); }
  .resolved-mock, .ingredient-mock {
    list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px;
    font-size: 13.5px;
  }
  .ingredient-mock { color: var(--ink-muted); font-family: "Source Sans 3", monospace; }
  .ingredient-mock em { color: #C0362C; font-style: normal; font-weight: 700; }
  .resolved-mock li { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: rgba(255,255,255,0.88); }
  .resolved-mock b { font-weight: 800; font-size: 12px; white-space: nowrap; }
  .resolved-mock b.ok { color: var(--brand-accent); }
  .resolved-mock b.warn { color: #F5C451; }
  .compare-frame.is-animating .compare-before,
  .compare-frame.is-animating .compare-handle {
    transition: clip-path 0.8s cubic-bezier(.4,0,.2,1), left 0.8s cubic-bezier(.4,0,.2,1);
  }
  .compare-handle {
    position: absolute; top: 0; bottom: 0; width: 3px; background: #fff; transform: translateX(-50%);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.08); pointer-events: none; display: flex; align-items: center; justify-content: center;
    z-index: 2;
  }
  .compare-handle span {
    width: 40px; height: 40px; border-radius: 50%; background: #fff; color: var(--brand-dark);
    display: flex; align-items: center; justify-content: center; font-size: 16px;
    box-shadow: 0 6px 16px -6px rgba(var(--shadow-color), 0.5);
  }
  .compare-handle span.pulse { animation: compare-handle-pulse 1.8s ease-out infinite; }
  @keyframes compare-handle-pulse {
    0% { box-shadow: 0 6px 16px -6px rgba(var(--shadow-color), 0.5), 0 0 0 0 rgba(17,158,75,0.45); }
    70% { box-shadow: 0 6px 16px -6px rgba(var(--shadow-color), 0.5), 0 0 0 14px rgba(17,158,75,0); }
    100% { box-shadow: 0 6px 16px -6px rgba(var(--shadow-color), 0.5), 0 0 0 0 rgba(17,158,75,0); }
  }
  .compare-range {
    position: absolute; inset: 0; width: 100%; height: 100%; z-index: 3;
    cursor: ew-resize; touch-action: none; -webkit-tap-highlight-color: transparent;
  }
  .compare-range:focus-visible { outline: 2px solid var(--brand); outline-offset: -2px; border-radius: 20px; }
  .compare-caption { text-align: center; color: var(--ink-muted); font-size: 13.5px; margin-top: 16px; }

  /* ---- FAQ accordion ---- */
  .faq-list { display: flex; flex-direction: column; gap: 12px; max-width: 720px; margin: 0 auto; }
  .faq-item {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    overflow: hidden; transition: border-color 0.2s ease;
  }
  .faq-item.is-open { border-color: var(--brand); }
  .faq-question {
    width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    background: none; border: none; cursor: pointer; text-align: left;
    padding: 20px 22px; font-family: "Manrope", sans-serif; font-weight: 700; font-size: 15.5px;
    color: var(--ink); font-size: 16px;
  }
  .faq-chevron { flex: none; color: var(--ink-muted); transition: transform 0.3s ease, color 0.3s ease; }
  .faq-item.is-open .faq-chevron { transform: rotate(180deg); color: var(--brand); }
  .faq-answer-wrap {
    display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s cubic-bezier(.4,0,.2,1);
  }
  .faq-item.is-open .faq-answer-wrap { grid-template-rows: 1fr; }
  .faq-answer { overflow: hidden; }
  .faq-answer p { padding: 0 22px 20px; color: var(--ink-muted); font-size: 14.5px; line-height: 1.6; }

  /* ---- pricing (mirrors plan-card styles from pricing.html so the two
     pages read as one system) ---- */
  .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 900px; margin: 0 auto; text-align: left; }
  @media (max-width: 760px) { .plans-grid { grid-template-columns: 1fr; } }
  .plan-card {
    border: 1px solid var(--border); border-radius: 20px; padding: 24px; background: var(--surface);
    display: flex; flex-direction: column; gap: 6px; position: relative;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .plan-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px -20px rgba(var(--shadow-color), 0.35); }
  .plan-card.featured { border-color: var(--brand); box-shadow: 0 0 0 1.5px var(--brand); }
  .plan-card .tag {
    position: absolute; top: -11px; left: 20px; background: var(--brand); color: #fff;
    font-family: "Manrope", sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 999px;
  }
  .plan-card .name { font-family: "Manrope", sans-serif; font-weight: 700; font-size: 15px; color: var(--ink); }
  .plan-card .price { font-family: "Manrope", sans-serif; font-weight: 800; font-size: 26px; color: var(--ink); margin-top: 4px; }
  .plan-card .price span { font-size: 13px; font-weight: 600; color: var(--ink-muted); }
  .plan-card .note { font-size: 13px; color: var(--ink-muted); margin-top: 2px; }
  .plan-card .save { font-size: 12.5px; color: var(--brand); font-weight: 700; margin-top: 1px; }
  .pricing-footnote { text-align: center; color: var(--ink-muted); font-size: 13.5px; margin-top: 28px; }
  .pricing-footnote a { color: var(--brand-dark); font-weight: 700; text-decoration: none; }

  /* ---- waitlist ---- */
  .waitlist {
    background: linear-gradient(150deg, var(--brand-dark), var(--brand));
    border-radius: 28px; padding: 56px 40px; text-align: center; color: #fff;
    max-width: 1160px; margin: 0 auto;
  }
  @media (max-width: 640px) { .waitlist { padding: 40px 22px; border-radius: 20px; } }
  .waitlist h2 { color: #fff; font-size: clamp(24px, 3.2vw, 32px); }
  .waitlist p { color: rgba(255,255,255,0.85); margin-top: 12px; font-size: 15.5px; max-width: 42ch; margin-left: auto; margin-right: auto; }
  .btn-store {
    display: inline-flex; align-items: center; gap: 10px; margin-top: 28px;
    background: #fff; color: var(--brand-dark); text-decoration: none; font-weight: 800;
    font-size: 15px; padding: 14px 26px; border-radius: 12px;
    font-family: "Source Sans 3", sans-serif;
  }

  /* ---- footer ---- */
  footer { border-top: 1px solid var(--border); padding: 40px 0; margin-top: 40px; }
  .footer-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .footer-links { display: flex; flex-wrap: wrap; gap: 10px 22px; list-style: none; padding: 0; margin: 0; }
  .footer-links a { text-decoration: none; color: var(--ink-muted); font-size: 13.5px; font-weight: 600; }
  .footer-copy { color: var(--ink-muted); font-size: 13px; }

  /* ---- scroll reveal ---- */
  .reveal .section-head,
  .reveal .feature-card,
  .reveal .step,
  .reveal .certifiers-track-wrap,
  .reveal .compare,
  .reveal .plan-card,
  .reveal .waitlist,
  .reveal .faq-item {
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.7s cubic-bezier(.16,.8,.3,1), transform 0.7s cubic-bezier(.16,.8,.3,1);
    transition-delay: calc(var(--i, 0) * 70ms);
  }
  .reveal.is-visible .section-head,
  .reveal.is-visible .feature-card,
  .reveal.is-visible .step,
  .reveal.is-visible .certifiers-track-wrap,
  .reveal.is-visible .compare,
  .reveal.is-visible .plan-card,
  .reveal.is-visible .waitlist,
  .reveal.is-visible .faq-item {
    opacity: 1;
    transform: translateY(0);
  }

  /* ---- hero phone slider ---- */
  .phone .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 0.6s ease; pointer-events: none; }
  .phone .slide.active { opacity: 1; pointer-events: auto; }

  .phone .result-card, .phone .ecode-card {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -52%);
    width: 172px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18);
    border-radius: 16px; padding: 14px; backdrop-filter: blur(6px); z-index: 3;
  }
  .phone .result-badge {
    display: inline-block; background: rgba(124,252,0,0.16); color: var(--brand-accent);
    font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 999px; margin-bottom: 10px;
  }
  .phone .result-name { color: #fff; font-family: "Manrope", sans-serif; font-weight: 700; font-size: 13px; }
  .phone .result-brand { color: rgba(255,255,255,0.65); font-size: 11.5px; margin-top: 2px; }
  .phone .result-source { color: rgba(255,255,255,0.45); font-size: 10.5px; margin-top: 8px; }

  .phone .ecode-row {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; color: rgba(255,255,255,0.85); padding: 6px 0;
  }
  .phone .ecode-row + .ecode-row { border-top: 1px solid rgba(255,255,255,0.1); }
  .phone .ecode-ok { color: var(--brand-accent); font-weight: 700; font-size: 11px; }
  .phone .ecode-warn { color: #F5C451; font-weight: 700; font-size: 11px; }

  .phone .dots {
    position: absolute; bottom: 68px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 6px; z-index: 6;
  }
  .phone .dot {
    width: 6px; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.35);
    border: none; padding: 0; cursor: pointer;
  }
  .phone .dot.active { background: #fff; width: 16px; }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .reveal .section-head, .reveal .feature-card, .reveal .step, .reveal .certifiers-track-wrap, .reveal .compare, .reveal .plan-card, .reveal .waitlist, .reveal .faq-item {
      transition: none; opacity: 1; transform: none;
    }
    .phone .slide { transition: none; }
    .certifiers-track { animation: none; }
    .compare-handle span.pulse { animation: none; }
    .faq-answer-wrap { transition: none; }
  }
      `}</style>

      <header className="nav">
        <div className="wrap nav-row">
          <a className="brand" href="#top">
            <img
              src="/logo.png"
              alt="Halalzur"
              width={30}
              height={30}
              style={{ borderRadius: "22%", display: "block" }}
            />
            <span className="brand-name">
              Halal<span>zur</span>
            </span>
          </a>
          <nav>
            <ul className="nav-links">
              <li>
                <a href="#features">Xüsusiyyətlər</a>
              </li>
              <li>
                <a href="#how">Necə işləyir</a>
              </li>
              <li>
                <a href="#certifiers">Sertifikat orqanları</a>
              </li>
              <li>
                <a href="#pricing">Qiymət</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </nav>
          <a className="nav-cta nav-mobile-hide" href={APP_STORE_URL}>
            <svg width="14" height="14" viewBox="0 0 384 512" fill="currentColor">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            Tətbiqi yüklə
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-blob"></div>
          <div className="wrap hero-grid">
            <div>
              <div className="eyebrow">Hazırlanır — tezliklə App Store-da</div>
              <h1>
                Məhsulunu skan et.
                <br />
                <span className="accent">Halal</span> statusunu öyrən.
              </h1>
              <p className="lede">
                Halalzur barkodu oxuyur və məhsulun halal statusunu GIMDES, JAKIM və
                AZSTANDART Halal kimi tanınan sertifikat orqanlarının məlumatlarına
                əsaslanaraq göstərir — aydın, izahlı və şəffaf şəkildə.
              </p>
              <div className="hero-actions">
                <a className="btn-primary" href={APP_STORE_URL}>
                  <svg width="17" height="17" viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  Tətbiqi yüklə
                </a>
                <a className="btn-secondary" href="#how">
                  Necə işləyir
                </a>
              </div>
              <div className="trust-strip">
                <div className="trust-label">Əsaslandığı sertifikat orqanları</div>
                <div className="trust-logos">
                  <span className="trust-chip">GIMDES</span>
                  <span className="trust-chip">JAKIM</span>
                  <span className="trust-chip">AZSTANDART Halal</span>
                  <span className="trust-chip">HAK</span>
                  <span className="trust-chip">SMIIC</span>
                </div>
              </div>
            </div>

            <div className="phone-wrap">
              <HeroPhoneSlider />
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="wrap">
            <Reveal>
              <div className="section-head">
                <h2>Sadə, izahlı, mənbəyi göstərilən</h2>
                <p>Halalzur nəticəni deyil, nəticənin haradan gəldiyini göstərir — hər status bir izahla gəlir.</p>
              </div>
              <div className="features-grid">
                <div className="feature-card" style={stagger(0)}>
                  <div className="feature-icon">⌗</div>
                  <h3>Ani skan</h3>
                  <p>Barkodu kameraya tutun, saniyələr içində nəticəni görün.</p>
                </div>
                <div className="feature-card" style={stagger(1)}>
                  <div className="feature-icon">🛡</div>
                  <h3>İzahlı nəticə</h3>
                  <p>Halal, şübhəli və ya tövsiyə edilmir — hər status öz səbəbi ilə göstərilir.</p>
                </div>
                <div className="feature-card" style={stagger(2)}>
                  <div className="feature-icon">🧪</div>
                  <h3>E-kod bələdçisi</h3>
                  <p>Tərkibdəki E-kodların sertifikat orqanlarına görə statusunu ayrıca görün.</p>
                </div>
                <div className="feature-card" style={stagger(3)}>
                  <div className="feature-icon">🤝</div>
                  <h3>İcma töhfəsi</h3>
                  <p>Bazada olmayan məhsulu təklif edin, təsdiqləndikdə xal qazanın.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section steps" id="how">
          <div className="wrap">
            <Reveal>
              <div className="section-head">
                <h2>Necə işləyir</h2>
                <p>Üç addım — hər dəfə eyni aydınlıqla.</p>
              </div>
              <div className="steps-grid">
                <div className="step" style={stagger(0)}>
                  <div className="step-num">1</div>
                  <h3>Skan et</h3>
                  <p>Məhsulun barkodunu kameraya tutun.</p>
                </div>
                <div className="step" style={stagger(1)}>
                  <div className="step-num">2</div>
                  <h3>Yoxla</h3>
                  <p>Halal statusunu və mənbəyini dərhal görün.</p>
                </div>
                <div className="step" style={stagger(2)}>
                  <div className="step-num">3</div>
                  <h3>Etibar et</h3>
                  <p>Aydın izahla arxayın seçim edin.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section certifiers-band" id="certifiers">
          <div className="wrap">
            <Reveal>
              <div className="section-head">
                <h2>Tanınan sertifikat orqanları</h2>
                <p>Halalzur öz hökmünü vermir — tanınan orqanların dərc etdiyi məlumata istinad edir.</p>
              </div>
              <div className="certifiers-track-wrap">
                <div className="certifiers-track">
                  {[...CERTIFIERS, ...CERTIFIERS].map((c, i) => (
                    <div className="certifier-pill" key={`${c.name}-${i}`} aria-hidden={i >= CERTIFIERS.length}>
                      <b>{c.name}</b>
                      <span>{c.country}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section" id="demo" style={{ background: "var(--surface-2)" }}>
          <div className="wrap">
            <Reveal>
              <div className="section-head">
                <h2>Qarışıqlıqdan aydınlığa</h2>
                <p>Tərkib siyahısındakı anlaşılmaz kodları Halalzur sizin üçün aydın nəticəyə çevirir.</p>
              </div>
              <CompareSlider />
            </Reveal>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="wrap">
            <Reveal>
              <div className="section-head">
                <h2>Premium ilə limitsiz</h2>
                <p>Gündə 3 skan həmişə pulsuzdur. Limitsiz skan və tam sertifikat detalları üçün Premium-a keçin.</p>
              </div>
              <div className="plans-grid">
                <div className="plan-card" style={stagger(0)}>
                  <div className="name">Aylıq</div>
                  <div className="price">
                    $2.99<span> / ay</span>
                  </div>
                  <div className="note">Hər ay yenilənir</div>
                </div>
                <div className="plan-card featured" style={stagger(1)}>
                  <span className="tag">Ən sərfəli</span>
                  <div className="name">İllik</div>
                  <div className="price">
                    $19.99<span> / il</span>
                  </div>
                  <div className="note">Ayda ~$1.67-yə bərabər</div>
                  <div className="save">Aylıq plana görə 44% qənaət</div>
                </div>
                <div className="plan-card" style={stagger(2)}>
                  <div className="name">6 aylıq</div>
                  <div className="price">
                    $12.99<span> / 6 ay</span>
                  </div>
                  <div className="note">Hər 6 ayda yenilənir</div>
                  <div className="save">Aylıq plana görə 28% qənaət</div>
                </div>
              </div>
              <p className="pricing-footnote">
                Bütün planlar App Store vasitəsilə avtomatik yenilənən abunəlik olaraq satılır.{" "}
                <Link href="/pricing.html">Ətraflı qiymət siyasəti →</Link>
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section" id="download">
          <div className="wrap">
            <Reveal>
              <div className="waitlist">
                <h2>Halalzur-u indi yükləyin</h2>
                <p>iPhone-unuzda App Store-dan endirin, məhsulları saniyələr içində skan etməyə başlayın.</p>
                <a className="btn-store" href={APP_STORE_URL}>
                  <svg width="19" height="19" viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  App Store-dan yüklə
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="wrap">
            <Reveal>
              <div className="section-head">
                <h2>Tez-tez verilən suallar</h2>
              </div>
              <FaqAccordion />
            </Reveal>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap footer-row">
          <span className="brand-name">
            Halal<span style={{ color: "var(--brand)" }}>zur</span>
          </span>
          <ul className="footer-links">
            <li>
              <a href="#features">Xüsusiyyətlər</a>
            </li>
            <li>
              <a href="#certifiers">Sertifikat orqanları</a>
            </li>
            <li>
              <a href="#faq">FAQ</a>
            </li>
            <li>
              <Link href="/privacy.html">Məxfilik siyasəti</Link>
            </li>
            <li>
              <Link href="/terms.html">İstifadə şərtləri</Link>
            </li>
            <li>
              <Link href="/pricing.html">Qiymət siyasəti</Link>
            </li>
            <li>
              <Link href="/delete-account.html">Hesabı sil</Link>
            </li>
          </ul>
          <span className="footer-copy">© 2026 Halalzur</span>
        </div>
      </footer>
    </>
  );
}
