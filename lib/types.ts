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
  scansThisMonth: number;
};
