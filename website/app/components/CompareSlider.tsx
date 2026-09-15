"use client";

import { useState } from "react";

export function CompareSlider() {
  const [percent, setPercent] = useState(46);

  return (
    <div className="compare">
      <div className="compare-frame-wrap">
        <div className="compare-frame">
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
            <span>⇔</span>
          </div>
        </div>
        <input
          type="range"
          className="compare-range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          aria-label="Tərkib siyahısı ilə Halalzur nəticəsini müqayisə et"
        />
      </div>
      <p className="compare-caption">Slaideri çəkin — solda xam tərkib siyahısı, sağda Halalzur-un aydın nəticəsi.</p>
    </div>
  );
}
