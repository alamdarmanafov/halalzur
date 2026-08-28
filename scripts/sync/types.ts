export type SyncedEntry = {
  entry_type: 'product' | 'company';
  barcode: string | null;
  product_name: string | null;
  brand: string;
  category: string | null;
  status: 'halal' | 'haram' | 'mushbooh' | 'unknown';
  certifier_id: string;
  certificate_number: string | null;
  verified_at: string | null;
  ingredients: string[];
  notes: string | null;
  source_url: string | null;
};
