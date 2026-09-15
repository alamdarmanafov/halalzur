"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

const DEFAULT_PERCENT = 50;
const MIN_PERCENT = 18;
const MAX_PERCENT = 82;
const DEMO_STEPS = [MAX_PERCENT, MIN_PERCENT, DEFAULT_PERCENT];
const DEMO_STEP_MS = 800;

function clamp(value: number) {
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, value));
}

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
  const frameRef = useRef<HTMLDivElement>(null);
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

  // Window-level drag listeners — the standard robust pattern for custom
  // sliders. Relying only on the target element's own pointer capture can
  // silently stop tracking mid-drag in some browsers; binding move/up on
  // window guarantees every subsequent pointer event is caught regardless
  // of where the cursor ends up.
  useEffect(() => {
    function updateFromClientX(clientX: number) {
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      setPercent(clamp(Math.round(ratio * 100)));
    }

    function onMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      updateFromClientX(e.clientX);
    }
    function onUp() {
      draggingRef.current = false;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
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

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    stopDemo();
    draggingRef.current = true;
    const frame = frameRef.current;
    if (frame) {
      const rect = frame.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setPercent(clamp(Math.round(ratio * 100)));
    }
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      stopDemo();
      setPercent((p) => clamp(p - 5));
    } else if (e.key === "ArrowRight") {
      stopDemo();
      setPercent((p) => clamp(p + 5));
    } else if (e.key === "Home") {
      stopDemo();
      setPercent(MIN_PERCENT);
    } else if (e.key === "End") {
      stopDemo();
      setPercent(MAX_PERCENT);
    }
  }

  return (
    <div className="compare" ref={wrapRef}>
      <div className="compare-summary">
        <span className="result-overall-badge status-warn">⚠ Şübhəli</span>
        <span className="result-overall-name">Nümunə: Fındıqlı Şokolad Kremi</span>
      </div>
      <div className="compare-frame-wrap">
        <div className={`compare-frame${isDemoing ? " is-animating" : ""}`} ref={frameRef}>
          <div className="compare-pane compare-after">
            <span className="compare-label compare-label-after">Halalzur ilə</span>
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
          <div
            className="compare-range"
            role="slider"
            tabIndex={0}
            aria-label="Tərkib siyahısı ilə Halalzur nəticəsini müqayisə et"
            aria-valuemin={MIN_PERCENT}
            aria-valuemax={MAX_PERCENT}
            aria-valuenow={percent}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      <p className="compare-caption">
        ◀ Slaideri çəkin ▶ — solda xam tərkib siyahısı, sağda Halalzur-un E-kod və tərkib üzrə tapdığı cavablar.
      </p>
    </div>
  );
}
