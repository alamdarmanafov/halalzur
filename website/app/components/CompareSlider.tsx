"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";

const DEFAULT_PERCENT = 46;
const DEMO_STEPS = [86, 12, DEFAULT_PERCENT];
const DEMO_STEP_MS = 800;

const BEFORE_ITEMS: { label: string; note?: string }[] = [
  { label: "Şəkər, bitki yağı" },
  { label: "E471", note: "mənşəyi?" },
  { label: "E330", note: "mənşəyi?" },
  { label: "Emulqator (soya)" },
  { label: "Aromatizator" },
];

const AFTER_ITEMS: { label: string; status: "ok" | "warn"; verdict: string }[] = [
  { label: "Şəkər, bitki yağı", status: "ok", verdict: "Halal" },
  { label: "E471 — Mono/digliserid", status: "warn", verdict: "Şübhəli" },
  { label: "E330 — Sitrik turşu", status: "ok", verdict: "Halal" },
  { label: "Emulqator (soya)", status: "ok", verdict: "Halal" },
  { label: "Aromatizator", status: "ok", verdict: "Halal" },
];

export function CompareSlider() {
  const [percent, setPercent] = useState(DEFAULT_PERCENT);
  const [isDemoing, setIsDemoing] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hasInteractedRef = useRef(false);
  const demoStartedRef = useRef(false);
  const draggingRef = useRef(false);

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

  function percentFromEvent(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    return Math.min(100, Math.max(0, Math.round(ratio * 100)));
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    stopDemo();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPercent(percentFromEvent(e));
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    setPercent(percentFromEvent(e));
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      stopDemo();
      setPercent((p) => Math.max(0, p - 5));
    } else if (e.key === "ArrowRight") {
      stopDemo();
      setPercent((p) => Math.min(100, p + 5));
    } else if (e.key === "Home") {
      stopDemo();
      setPercent(0);
    } else if (e.key === "End") {
      stopDemo();
      setPercent(100);
    }
  }

  return (
    <div className="compare" ref={wrapRef}>
      <div className="compare-frame-wrap">
        <div className={`compare-frame${isDemoing ? " is-animating" : ""}`}>
          <div className="compare-pane compare-after">
            <span className="compare-label compare-label-after">Halalzur ilə</span>
            <div className="result-overall">
              <span className="result-overall-badge status-warn">⚠ Şübhəli</span>
              <span className="result-overall-name">Fındıqlı Şokolad Kremi</span>
            </div>
            <ul className="resolved-mock">
              {AFTER_ITEMS.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <b className={item.status}>
                    {item.status === "ok" ? "✓" : "⚠"} {item.verdict}
                  </b>
                </li>
              ))}
            </ul>
          </div>
          <div className="compare-pane compare-before" style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}>
            <span className="compare-label compare-label-before">Tərkib siyahısı</span>
            <ul className="ingredient-mock">
              {BEFORE_ITEMS.map((item) => (
                <li key={item.label}>
                  {item.label}
                  {item.note ? <em> — {item.note}</em> : null}
                </li>
              ))}
            </ul>
          </div>
          <div className="compare-handle" style={{ left: `${percent}%` }} aria-hidden="true">
            <span className={hasInteracted ? "" : "pulse"}>⇔</span>
          </div>
        </div>
        <div
          className="compare-range"
          role="slider"
          tabIndex={0}
          aria-label="Tərkib siyahısı ilə Halalzur nəticəsini müqayisə et"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        />
      </div>
      <p className="compare-caption">
        ◀ Slaideri çəkin ▶ — solda xam tərkib siyahısı, sağda Halalzur-un E-kod və tərkib üzrə tapdığı cavablar.
      </p>
    </div>
  );
}
