"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Halalzur halal hökmü verirmi?",
    a: "Xeyr. Halalzur dini hökm vermir — yalnız tanınan sertifikat orqanlarının (GIMDES, JAKIM, AZSTANDART Halal və s.) dərc etdiyi məlumatı göstərir.",
  },
  {
    q: "Hansı platformalarda əlçatan olacaq?",
    a: "Halalzur ilk mərhələdə yalnız iOS (iPhone) üçün hazırlanır.",
  },
  {
    q: "Pulsuzdurmu?",
    a: "Bəli — gündə 3 skan pulsuzdur. Limitsiz istifadə üçün Premium abunəlik olacaq.",
  },
  {
    q: "Öz məhsulumu əlavə edə bilərəmmi?",
    a: "Bəli — bazada olmayan məhsulu tətbiq daxilində təklif edə bilərsiniz, təsdiqləndikdə xal qazanırsınız.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq-list">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div className={`faq-item${isOpen ? " is-open" : ""}`} key={item.q} style={{ ["--i" as string]: i } as React.CSSProperties}>
            <button
              className="faq-question"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span>{item.q}</span>
              <svg className="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="faq-answer-wrap">
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
