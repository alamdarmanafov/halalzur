"use client";

import { useEffect, useRef, useState } from "react";

const ITEMS: { before: string; after: string; status: "ok" | "warn" }[] = [
  { before: "Şəkər, bitki yağı — ?", after: "Bitki mənşəli tərkib, sertifikatla təsdiqlənib — Halal", status: "ok" },
  { before: "E471 — ?", after: "Mono/digliserid, mənşəyi məhsuldan-məhsula dəyişir — Şübhəli", status: "warn" },
  { before: "E330 — ?", after: "Sitrik turşu, fermentasiya ilə alınır — Halal", status: "ok" },
  { before: "Emulqator (soya) — ?", after: "Bitki (soya) mənşəli — Halal", status: "ok" },
  { before: "Aromatizator — ?", after: "Təbii mənbə göstərilib — Halal", status: "ok" },
];

export function CompareSlider() {
  const [isScanning, setIsScanning] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedRef.current) {
          startedRef.current = true;
          observer.disconnect();
          setTimeout(() => setIsScanning(true), 300);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="compare" ref={wrapRef}>
      <div className={`compare-card${isScanning ? " is-scanning" : ""}`}>
        <div className="compare-scan-line" aria-hidden="true" />
        <div className="compare-scan-head">
          <span className="result-overall-badge status-warn">⚠ Şübhəli</span>
          <span className="result-overall-name">Nümunə: Fındıqlı Şokolad Kremi</span>
        </div>
        <ul className="compare-rows">
          {ITEMS.map((item) => (
            <li key={item.before}>
              <span className="compare-before-text">{item.before}</span>
              <svg className="compare-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={`compare-after-text ${item.status}`}>
                {item.status === "ok" ? "✓" : "⚠"} {item.after}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="compare-caption">Halalzur tərkibdəki hər maddəni və E-kodu ayrı-ayrı izah edir — nəticə ilə yanaşı.</p>
    </div>
  );
}
