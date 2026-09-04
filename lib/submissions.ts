import { supabase, isSupabaseConfigured } from './supabase';
import { HalalStatus, ProductSubmission, ReviewStatus } from './types';

type SubmissionRow = {
  id: string;
  submitted_by: string;
  submitted_by_name: string | null;
  barcode: string;
  product_name: string;
  brand: string;
  category: string | null;
  suggested_status: HalalStatus;
  ingredients: string[] | null;
  notes: string | null;
  review_status: ReviewStatus;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function mapRow(row: SubmissionRow): ProductSubmission {
  return {
    id: row.id,
    submittedBy: row.submitted_by,
    submittedByName: row.submitted_by_name,
    barcode: row.barcode,
    productName: row.product_name,
    brand: row.brand,
    category: row.category,
    suggestedStatus: row.suggested_status,
    ingredients: row.ingredients ?? [],
    notes: row.notes,
    reviewStatus: row.review_status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase qoşulmayıb — məhsul təklifi göndərilə bilmir.');
  }
  return supabase;
}

export async function submitProduct(input: {
  userId: string;
  userName: string;
  barcode: string;
  productName: string;
  brand: string;
  category: string;
  suggestedStatus: HalalStatus;
  ingredients: string[];
  notes: string;
}): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('product_submissions').insert({
    submitted_by: input.userId,
    submitted_by_name: input.userName,
    barcode: input.barcode,
    product_name: input.productName,
    brand: input.brand,
    category: input.category || null,
    suggested_status: input.suggestedStatus,
    ingredients: input.ingredients,
    notes: input.notes || null,
  });
  if (error) throw error;
}

export async function hasSubmittedProduct(userId: string, barcode: string): Promise<boolean> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('product_submissions')
    .select('id')
    .eq('submitted_by', userId)
    .eq('barcode', barcode)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function fetchMySubmissions(userId: string): Promise<ProductSubmission[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('product_submissions')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getApprovedCount(userId: string): Promise<number> {
  const client = requireSupabase();
  const { count, error } = await client
    .from('product_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('submitted_by', userId)
    .eq('review_status', 'approved');
  if (error) throw error;
  return count ?? 0;
}

export async function getPoints(userId: string): Promise<number> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('user_points')
    .select('points')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.points ?? 0;
}

// Review (approve/reject) is admin-panel-only now — see
// supabase/migration_2026_09_04_admin_rls_lockdown.sql. It used to also be
// reachable from an in-app admin.tsx screen that wrote straight to
// certified_entries/product_submissions using the same open ("Public
// update") RLS every regular user's own writes need, since the app has no
// server-verified admin session (Apple/Google sign-in never gets a
// Supabase Auth token to check against admin_profiles) — meaning anyone
// holding the public anon key could self-approve their own submission, or
// certify anything as Halal, without ever being a real admin. That screen
// is removed; review now only happens through the admin panel, which
// authenticates with a real Supabase Auth admin session.
