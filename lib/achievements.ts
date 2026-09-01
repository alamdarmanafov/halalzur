import { Language } from './i18n';

export type AchievementTier = {
  threshold: number;
  days: number;
  label: string;
  labelEn: string;
  labelRu: string;
  labelTr: string;
};

export function tierLabel(tier: AchievementTier, language: Language): string {
  if (language === 'en') return tier.labelEn;
  if (language === 'ru') return tier.labelRu;
  if (language === 'tr') return tier.labelTr;
  return tier.label;
}

/**
 * Rewards for approved product submissions (lib/submissions.ts
 * approveSubmission). Thresholds are cumulative — reaching 30 approved
 * submissions means both the 10- and 30-tier have technically been
 * passed, but only the newly-crossed tier grants a reward each time
 * (see lib/auth-context.tsx grantAchievementPremium).
 */
export const ACHIEVEMENT_TIERS: AchievementTier[] = [
  { threshold: 1, days: 1, label: 'Xoş gəldin bonusu', labelEn: 'Welcome bonus', labelRu: 'Приветственный бонус', labelTr: 'Hoş geldin bonusu' },
  { threshold: 5, days: 3, label: '3 günlük Premium', labelEn: '3-day Premium', labelRu: '3 дня Premium', labelTr: '3 günlük Premium' },
  { threshold: 10, days: 7, label: '1 həftəlik Premium', labelEn: '1-week Premium', labelRu: '1 неделя Premium', labelTr: '1 haftalık Premium' },
  { threshold: 20, days: 14, label: '2 həftəlik Premium', labelEn: '2-week Premium', labelRu: '2 недели Premium', labelTr: '2 haftalık Premium' },
  { threshold: 30, days: 30, label: '1 aylıq Premium', labelEn: '1-month Premium', labelRu: '1 месяц Premium', labelTr: '1 aylık Premium' },
  { threshold: 50, days: 90, label: '3 aylıq Premium', labelEn: '3-month Premium', labelRu: '3 месяца Premium', labelTr: '3 aylık Premium' },
  { threshold: 75, days: 180, label: '6 aylıq Premium', labelEn: '6-month Premium', labelRu: '6 месяцев Premium', labelTr: '6 aylık Premium' },
  { threshold: 100, days: 365, label: '1 illik Premium', labelEn: '1-year Premium', labelRu: '1 год Premium', labelTr: '1 yıllık Premium' },
];

/** The highest tier the user has crossed but not yet been rewarded for. */
export function highestUnclaimedTier(
  approvedCount: number,
  claimed: number[]
): AchievementTier | null {
  const eligible = ACHIEVEMENT_TIERS.filter(
    (t) => approvedCount >= t.threshold && !claimed.includes(t.threshold)
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((best, t) => (t.threshold > best.threshold ? t : best));
}
