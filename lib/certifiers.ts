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
  },
  {
    id: 'hak',
    name: 'Helal Akreditasyon Kurumu (Türkiyə Gıda / Helal Standartları Qurumu)',
    shortName: 'HAK',
    country: 'Türkiyə',
  },
  {
    id: 'smiic',
    name: 'SMIIC – Standards and Metrology Institute for Islamic Countries',
    shortName: 'SMIIC',
    country: 'Beynəlxalq',
  },
  {
    id: 'jakim',
    name: 'JAKIM – Department of Islamic Development Malaysia',
    shortName: 'JAKIM',
    country: 'Malaziya',
  },
];

export function getCertifier(id: string): Certifier | undefined {
  return CERTIFIERS.find((c) => c.id === id);
}
