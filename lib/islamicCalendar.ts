export type IslamicHoliday = {
  id: string;
  nameAz: string;
  nameEn: string;
  emoji: string;
  /** Inclusive 'YYYY-MM-DD' range, local calendar date. */
  start: string;
  end: string;
  messageAz: string;
  messageEn: string;
};

/**
 * Gregorian dates for Hijri calendar events are estimates — the Hijri
 * calendar is based on moon sighting, so the real start/end can shift by
 * a day in either direction from what's listed here. Good enough for a
 * banner nudge; not used for anything religiously authoritative (that's
 * exactly what the certifier-sourced halal status elsewhere in the app
 * is for, which never relies on a guessed date).
 */
export const ISLAMIC_HOLIDAYS: IslamicHoliday[] = [
  {
    id: 'ramadan-2026',
    nameAz: 'Ramazan',
    nameEn: 'Ramadan',
    emoji: '🌙',
    start: '2026-02-18',
    end: '2026-03-19',
    messageAz: 'Ramazan Mübarəkdir! Sahur və iftar üçün halal məhsulları yoxlayın.',
    messageEn: 'Ramadan Mubarak! Check products are halal before suhoor and iftar.',
  },
  {
    id: 'eid-fitr-2026',
    nameAz: 'Ramazan bayramı',
    nameEn: 'Eid al-Fitr',
    emoji: '🎉',
    start: '2026-03-20',
    end: '2026-03-22',
    messageAz: 'Ramazan bayramınız mübarək olsun!',
    messageEn: 'Happy Eid al-Fitr!',
  },
  {
    id: 'eid-adha-2026',
    nameAz: 'Qurban bayramı',
    nameEn: 'Eid al-Adha',
    emoji: '🐑',
    start: '2026-05-27',
    end: '2026-05-30',
    messageAz: 'Qurban bayramınız mübarək olsun!',
    messageEn: 'Happy Eid al-Adha!',
  },
  {
    id: 'ramadan-2027',
    nameAz: 'Ramazan',
    nameEn: 'Ramadan',
    emoji: '🌙',
    start: '2027-02-08',
    end: '2027-03-09',
    messageAz: 'Ramazan Mübarəkdir! Sahur və iftar üçün halal məhsulları yoxlayın.',
    messageEn: 'Ramadan Mubarak! Check products are halal before suhoor and iftar.',
  },
  {
    id: 'eid-fitr-2027',
    nameAz: 'Ramazan bayramı',
    nameEn: 'Eid al-Fitr',
    emoji: '🎉',
    start: '2027-03-10',
    end: '2027-03-12',
    messageAz: 'Ramazan bayramınız mübarək olsun!',
    messageEn: 'Happy Eid al-Fitr!',
  },
  {
    id: 'eid-adha-2027',
    nameAz: 'Qurban bayramı',
    nameEn: 'Eid al-Adha',
    emoji: '🐑',
    start: '2027-05-16',
    end: '2027-05-19',
    messageAz: 'Qurban bayramınız mübarək olsun!',
    messageEn: 'Happy Eid al-Adha!',
  },
];

/** The holiday active today, if any — 'today' is injectable for testing. */
export function getActiveHoliday(today: Date = new Date()): IslamicHoliday | null {
  const iso = today.toISOString().slice(0, 10);
  return ISLAMIC_HOLIDAYS.find((h) => iso >= h.start && iso <= h.end) ?? null;
}
