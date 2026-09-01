import { Certifier } from './types';

/**
 * Recognised halal-certification bodies Halalzur cross-checks against.
 * Each entry is a display record only — real verification requires a data
 * agreement / API integration with the certifier (see lib/certification.ts).
 */
export const CERTIFIERS: Certifier[] = [
  {
    id: 'gimdes',
    name: 'GIMDES – Gıda ve İhtiyaç Maddeleri Denetleme ve Sertifikalandırma Araştırmaları Derneği',
    shortName: 'GIMDES',
    country: 'Türkiyə',
    sourceUrl: null,
  },
  {
    id: 'hak',
    name: 'Helal Akreditasyon Kurumu (Türkiyə Gıda / Helal Standartları Qurumu)',
    shortName: 'HAK',
    country: 'Türkiyə',
    sourceUrl: null,
  },
  {
    id: 'smiic',
    name: 'SMIIC – Standards and Metrology Institute for Islamic Countries',
    shortName: 'SMIIC',
    country: 'Beynəlxalq',
    sourceUrl: null,
  },
  {
    id: 'jakim',
    name: 'JAKIM – Department of Islamic Development Malaysia',
    shortName: 'JAKIM',
    country: 'Malaziya',
    sourceUrl: null,
  },
  {
    id: 'azstandart',
    name: 'AZSTANDART Halal Sertifikatlaşdırma Orqanı (Azərbaycan Standartlaşdırma İnstitutu)',
    shortName: 'AZSTANDART',
    country: 'Azərbaycan',
    sourceUrl: null,
  },
];

export function getCertifier(id: string): Certifier | undefined {
  return CERTIFIERS.find((c) => c.id === id);
}
