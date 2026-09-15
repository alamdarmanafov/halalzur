"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { E_CODES, ECODE_STATUS_LABEL, slugForECode, type ECodeEntry, type ECodeStatus } from "../data/ecodes";

const STATUS_STYLE: Record<ECodeStatus, string> = {
  halal: "ok",
  haram: "bad",
  mushbooh: "warn",
  depends: "neutral",
};

const EXAMPLE_CODES = ["E471", "E120", "E322", "E951"];

function search(query: string): ECodeEntry[] {
  const q = query.trim().toLowerCase().replace(/^e/, "");
  if (!q) return [];
  return E_CODES.filter((e) => e.code.toLowerCase().replace(/^e/, "").startsWith(q)).slice(0, 6);
}

export function ECodeLookup() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => search(query), [query]);

  return (
    <div className="ecode-lookup">
      <div className="ecode-lookup-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          inputMode="text"
          placeholder="E-kod yazın, məs. E471"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="E-kod axtar"
        />
      </div>

      {query.trim() === "" ? (
        <div className="ecode-lookup-examples">
          <span>Nümunə:</span>
          {EXAMPLE_CODES.map((c) => (
            <button key={c} type="button" onClick={() => setQuery(c)}>
              {c}
            </button>
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="ecode-lookup-empty">&ldquo;{query}&rdquo; tapılmadı — kodu yoxlayın (məs. E471).</p>
      ) : (
        <ul className="ecode-lookup-results">
          {results.map((entry) => (
            <li key={entry.code}>
              <Link href={`/e-kod/${slugForECode(entry.code)}`}>
                <span className="ecode-lookup-code">{entry.code}</span>
                <span className="ecode-lookup-name">{entry.name}</span>
                <span className={`ecode-lookup-status ${STATUS_STYLE[entry.status]}`}>
                  {ECODE_STATUS_LABEL[entry.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
