"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_PERCENT = 46;
const DEMO_STEPS = [86, 12, DEFAULT_PERCENT];
const DEMO_STEP_MS = 800;

export function CompareSlider() {
  const [percent, setPercent] = useState(DEFAULT_PERCENT);
  const [isDemoing, setIsDemoing] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hasInteractedRef = useRef(false);
  const demoStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = wrapRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !demoStartedRef.current) {
          demoStartedRef.current = true;
          observer.disconnect();
          startDemo();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startDemo() {
    setIsDemoing(true);
    let i = 0;
    const runStep = () => {
      if (hasInteractedRef.current) {
        setIsDemoing(false);
        return;
      }
      setPercent(DEMO_STEPS[i]);
      i += 1;
      if (i < DEMO_STEPS.length) {
        setTimeout(runStep, DEMO_STEP_MS);
      } else {
        setTimeout(() => setIsDemoing(false), DEMO_STEP_MS);
      }
    };
    setTimeout(runStep, 500);
  }

  function stopDemo() {
    if (hasInteractedRef.current) return;
    hasInteractedRef.current = true;
    setHasInteracted(true);
    setIsDemoing(false);
  }

  return (
    <div className="compare" ref={wrapRef}>
      <div className="compare-frame-wrap">
        <div className={`compare-frame${isDemoing ? " is-animating" : ""}`}>
          <div className="compare-pane compare-after">
            <span className="compare-label compare-label-after">Halalzur ilə</span>
            <span className="result-mock-badge">✓ Halal</span>
            <div className="result-mock-name">Fındıqlı Şokolad Kremi</div>
            <div className="result-mock-brand">Nesta Foods</div>
            <div className="result-mock-src">Mənbə: GIMDES sertifikatı</div>
          </div>
          <div className="compare-pane compare-before" style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}>
            <span className="compare-label compare-label-before">Tərkib siyahısı</span>
            <ul className="ingredient-mock">
              <li>Şəkər, bitki yağı</li>
              <li>
                E471 <em>— mənşəyi?</em>
              </li>
              <li>
                E120 <em>— mənşəyi?</em>
              </li>
              <li>Emulqator (soya)</li>
              <li>Aromatizator</li>
            </ul>
          </div>
          <div className="compare-handle" style={{ left: `${percent}%` }} aria-hidden="true">
            <span className={hasInteracted ? "" : "pulse"}>⇔</span>
          </div>
        </div>
        <input
          type="range"
          className="compare-range"
          min={0}
          max={100}
          value={percent}
          onPointerDown={stopDemo}
          onTouchStart={stopDemo}
          onChange={(e) => {
            stopDemo();
            setPercent(Number(e.target.value));
          }}
          aria-label="Tərkib siyahısı ilə Halalzur nəticəsini müqayisə et"
        />
      </div>
      <p className="compare-caption">◀ Slaideri çəkin ▶ — solda xam tərkib siyahısı, sağda Halalzur-un aydın nəticəsi.</p>
    </div>
  );
}
