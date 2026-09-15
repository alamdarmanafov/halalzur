import Link from "next/link";
import type { ReactNode } from "react";

type FooterLink = { href: string; label: string };

const BASE_STYLE = `
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
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font-family: "Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  h1, h2 { font-family: "Manrope", sans-serif; text-wrap: balance; margin: 0; }
  p, li { margin: 0; }
  a { color: var(--brand-dark); }
  .wrap { max-width: 760px; margin: 0 auto; padding: 0 24px; }

  header.nav { background: var(--bg); border-bottom: 1px solid var(--border); }
  .nav-row { max-width: 1160px; margin: 0 auto; padding: 0 24px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .brand img { width: 28px; height: 28px; }
  .brand-name { font-family: "Manrope", sans-serif; font-weight: 800; font-size: 18px; color: var(--ink); }
  .brand-name span { color: var(--brand); }
  .back-link { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--ink-muted); font-weight: 600; font-size: 14px; }
  .back-link:hover { color: var(--ink); }

  main { padding: 56px 0 96px; }
  .doc-head { margin-bottom: 40px; }
  .doc-head .eyebrow {
    display: inline-block; font-family: "Manrope", sans-serif; font-weight: 700; font-size: 12px;
    letter-spacing: 0.06em; text-transform: uppercase; color: var(--brand-dark);
    background: var(--brand-surface); padding: 6px 12px; border-radius: 999px; margin-bottom: 16px;
  }
  .doc-head h1 { font-size: clamp(28px, 4vw, 38px); line-height: 1.15; }
  .doc-head .updated { color: var(--ink-muted); font-size: 14px; margin-top: 12px; display: block; }
  .doc-head p.lede { color: var(--ink-muted); font-size: 16px; line-height: 1.6; margin-top: 14px; max-width: 56ch; }

  .doc-body { display: flex; flex-direction: column; gap: 36px; }
  .doc-body section { display: flex; flex-direction: column; gap: 12px; }
  .doc-body h2 { font-size: 19px; color: var(--ink); }
  .doc-body p, .doc-body li { font-size: 15.5px; line-height: 1.7; color: var(--ink-muted); }
  .doc-body ul { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
  .doc-body strong { color: var(--ink); font-weight: 700; }

  .data-table {
    border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--surface);
  }
  .data-row { display: grid; grid-template-columns: 1fr 1.4fr; gap: 16px; padding: 14px 18px; }
  .data-row + .data-row { border-top: 1px solid var(--border); }
  .data-row .k { font-weight: 700; color: var(--ink); font-size: 14.5px; }
  .data-row .v { color: var(--ink-muted); font-size: 14.5px; line-height: 1.6; }
  @media (max-width: 560px) { .data-row { grid-template-columns: 1fr; gap: 4px; } }

  .callout {
    background: var(--surface-2); border-radius: 14px; padding: 18px 20px; font-size: 14.5px;
    color: var(--ink); line-height: 1.6;
  }
  .callout a { font-weight: 700; }

  footer { border-top: 1px solid var(--border); padding: 32px 0; }
  .footer-row { max-width: 1160px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .footer-copy { color: var(--ink-muted); font-size: 13px; }
  .footer-links { display: flex; flex-wrap: wrap; gap: 8px 20px; list-style: none; padding: 0; margin: 0; }
  .footer-links a { text-decoration: none; color: var(--ink-muted); font-size: 13.5px; font-weight: 600; }
`;

export function DocPage({
  eyebrow,
  title,
  updated,
  lede,
  footerLinks,
  extraStyle,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  lede?: ReactNode;
  footerLinks: FooterLink[];
  extraStyle?: string;
  children: ReactNode;
}) {
  return (
    <>
      <style>{BASE_STYLE}</style>
      {extraStyle ? <style>{extraStyle}</style> : null}

      <header className="nav">
        <div className="nav-row">
          <a className="brand" href="/">
            <img src="/logo.png" alt="Halalzur" style={{ borderRadius: "22%", display: "block" }} />
            <span className="brand-name">
              Halal<span>zur</span>
            </span>
          </a>
          <Link className="back-link" href="/">
            ← Ana səhifə
          </Link>
        </div>
      </header>

      <main>
        <div className="wrap">
          <div className="doc-head">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {updated ? <span className="updated">{updated}</span> : null}
            {lede ? <p className="lede">{lede}</p> : null}
          </div>

          <div className="doc-body">{children}</div>
        </div>
      </main>

      <footer>
        <div className="footer-row">
          <span className="footer-copy">© 2026 Halalzur</span>
          <ul className="footer-links">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </>
  );
}
