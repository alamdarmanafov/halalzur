export type BadgeId = 'premium' | 'welcome' | 'contributor' | 'master' | 'scanner' | 'pointsClub';

export const BADGE_ICON: Record<BadgeId, string> = {
  premium: 'star',
  welcome: 'flag',
  contributor: 'ribbon',
  master: 'trophy',
  scanner: 'scan-circle',
  pointsClub: 'flash',
};

export const BADGE_LABEL_KEY: Record<BadgeId, string> = {
  premium: 'badgePremium',
  welcome: 'badgeWelcome',
  contributor: 'badgeContributor',
  master: 'badgeMaster',
  scanner: 'badgeScanner',
  pointsClub: 'badgePointsClub',
};

/**
 * Glanceable badge row for the Profile screen — a compact summary,
 * distinct from app/achievements.tsx's detailed tier-by-tier progress
 * list. Derived entirely from data the Profile screen already loads
 * (no new queries), so a badge here always mirrors real state.
 */
export function computeBadges(input: {
  isPremium: boolean;
  claimedAchievements: number[];
  points: number;
  scansCount: number;
}): BadgeId[] {
  const badges: BadgeId[] = [];
  if (input.isPremium) badges.push('premium');
  if (input.claimedAchievements.length > 0) badges.push('welcome');
  if (input.claimedAchievements.some((t) => t >= 20)) badges.push('contributor');
  if (input.claimedAchievements.includes(100)) badges.push('master');
  if (input.scansCount >= 50) badges.push('scanner');
  if (input.points >= 100) badges.push('pointsClub');
  return badges;
}
