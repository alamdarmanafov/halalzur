import type { MetadataRoute } from "next";
import { E_CODES, slugForECode } from "./data/ecodes";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://halalzur.com/", changeFrequency: "weekly", priority: 1.0 },
    { url: "https://halalzur.com/pricing.html", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://halalzur.com/privacy.html", changeFrequency: "monthly", priority: 0.4 },
    { url: "https://halalzur.com/delete-account.html", changeFrequency: "monthly", priority: 0.3 },
    { url: "https://halalzur.com/terms.html", changeFrequency: "monthly", priority: 0.4 },
    { url: "https://halalzur.com/e-kod", changeFrequency: "monthly", priority: 0.6 },
    ...E_CODES.map((e) => ({
      url: `https://halalzur.com/e-kod/${slugForECode(e.code)}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
