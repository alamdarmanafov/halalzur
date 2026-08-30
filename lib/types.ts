export type HalalStatus = 'halal' | 'haram' | 'mushbooh' | 'unknown';

export type Certifier = {
  id: string;
  name: string;
  shortName: string;
  country: string;
};

export type CertificationResult = {
  barcode: string;
  productName: string;
  brand: string;
  category: string;
  status: HalalStatus;
  certifier: Certifier | null;
  certificateNumber: string | null;
  verifiedAt: string | null;
  ingredients: string[];
  notes: string | null;
  imageEmoji: string;
};

export type SubscriptionPlan = 'free' | 'premium';

export type User = {
  id: string;
  name: string;
  email: string;
  plan: SubscriptionPlan;
  scansToday: number;
  lastScanDate: string | null; // 'YYYY-MM-DD', local date of the last counted scan
  // Set only when `plan: 'premium'` came from an achievement reward
  // (lib/achievements.ts) rather than a real purchase or admin grant —
  // auth-context reverts the plan to 'free' once this date passes.
  premiumExpiresAt: string | null;
  // Achievement thresholds (lib/achievements.ts ACHIEVEMENT_TIERS) already
  // rewarded, so crossing the same one again doesn't re-grant premium.
  claimedAchievements: number[];
};

/**
 * E-code status is NOT an AI judgement — it is a fixed classification
 * pulled from halal-certification bodies' own published additive guides
 * (GIMDES-style E-code lists). 'depends' means the certifier itself says
 * the status depends on the additive's source (animal vs. plant/synthetic)
 * and cannot be determined from the code alone.
 */
export type ECodeStatus = 'halal' | 'haram' | 'mushbooh' | 'depends';

export type ECodeEntry = {
  code: string;
  name: string;
  category: string;
  status: ECodeStatus;
  note: string;
};

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type ProductSubmission = {
  id: string;
  submittedBy: string;
  submittedByName: string | null;
  barcode: string;
  productName: string;
  brand: string;
  category: string | null;
  suggestedStatus: HalalStatus;
  ingredients: string[];
  notes: string | null;
  reviewStatus: ReviewStatus;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
};
