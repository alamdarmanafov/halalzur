"use client";

import { useEffect, useState } from "react";
import { APP_STORE_URL } from "../data/appStore";

export function StickyDownloadBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 560);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`sticky-download${visible ? " is-visible" : ""}`}>
      <div className="sticky-download-inner">
        <div className="sticky-download-brand">
          <img src="/logo.png" alt="" width={30} height={30} style={{ borderRadius: "22%", display: "block" }} />
          <span>
            Halal<span style={{ color: "var(--brand-accent)" }}>zur</span>
          </span>
        </div>
        <a className="sticky-download-cta" href={APP_STORE_URL}>
          <svg width="14" height="14" viewBox="0 0 384 512" fill="currentColor">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          Yüklə
        </a>
      </div>
    </div>
  );
}
