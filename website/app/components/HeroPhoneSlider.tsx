"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Slide = {
  hint: string;
  cta: string;
  body: ReactNode;
};

const SLIDES: Slide[] = [
  {
    hint: "Barkodu skan etmək üçün kameranı yönəldin",
    cta: "⌗ Skan etməyə başla",
    body: <div className="frame" />,
  },
  {
    hint: "Nəticə tapıldı",
    cta: "✓ Halal təsdiqləndi",
    body: (
      <div className="result-card">
        <div className="result-badge">🟢 Halal</div>
        <div className="result-name">Məhsul adı</div>
        <div className="result-brand">Nümunə Brend</div>
        <div className="result-source">Mənbə: GIMDES</div>
      </div>
    ),
  },
  {
    hint: "Tərkibdəki E-kodlar",
    cta: "🧪 E-kodları araşdır",
    body: (
      <div className="ecode-card">
        <div className="ecode-row">
          <span>E322</span>
          <span className="ecode-ok">Halal</span>
        </div>
        <div className="ecode-row">
          <span>E471</span>
          <span className="ecode-warn">Şübhəli</span>
        </div>
        <div className="ecode-row">
          <span>E330</span>
          <span className="ecode-ok">Halal</span>
        </div>
      </div>
    ),
  },
];

const INTERVAL_MS = 3200;

export function HeroPhoneSlider() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function goTo(index: number) {
    setActive(index);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
  }

  return (
    <div className="phone">
      <div className="notch"></div>
      <div className="screen">
        {SLIDES.map((slide, i) => (
          <div className={`slide ${i === active ? "active" : ""}`} key={i} aria-hidden={i !== active}>
            <div className="top-bar">
              <div className="row">
                <div className="brand-row">
                  <img
                    src="/logo.png"
                    alt="Halalzur"
                    width={20}
                    height={20}
                    style={{ borderRadius: "22%", display: "block" }}
                  />
                  <b>Halalzur</b>
                </div>
                <span className="bell">🔔</span>
              </div>
              <div className="hint">{slide.hint}</div>
            </div>
            {slide.body}
            <div className="bottom-bar">
              <span className="cta-pill">{slide.cta}</span>
            </div>
          </div>
        ))}
        <div className="dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slayd ${i + 1}`}
              className={`dot ${i === active ? "active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
