export type AchievementTier = {
  threshold: number;
  days: number;
  label: string;
};

/**
 * Rewards for approved product submissions (lib/submissions.ts
 * approveSubmission). Thresholds are cumulative — reaching 30 approved
 * submissions means both the 10- and 30-tier have technically been
 * passed, but only the newly-crossed tier grants a reward each time
 * (see lib/auth-context.tsx grantAchievementPremium).
 */
export const ACHIEVEMENT_TIERS: AchievementTier[] = [
  { threshold: 10, days: 7, label: '1 həftəlik Premium' },
  { threshold: 30, days: 30, label: '1 aylıq Premium' },
  { threshold: 50, days: 90, label: '3 aylıq Premium' },
  { threshold: 100, days: 365, label: '1 illik Premium' },
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
