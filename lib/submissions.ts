import { supabase, isSupabaseConfigured } from './supabase';
import { HalalStatus, ProductSubmission, ReviewStatus } from './types';

const POINTS_PER_APPROVAL = 10;

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

export async function fetchPendingSubmissions(): Promise<ProductSubmission[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('product_submissions')
    .select('*')
    .eq('review_status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
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

async function awardPoints(client: NonNullable<typeof supabase>, userId: string, userName: string | null) {
  const { data: existing } = await client
    .from('user_points')
    .select('points')
    .eq('user_id', userId)
    .maybeSingle();

  await client.from('user_points').upsert(
    {
      user_id: userId,
      user_name: userName,
      points: (existing?.points ?? 0) + POINTS_PER_APPROVAL,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

export async function approveSubmission(submission: ProductSubmission): Promise<void> {
  const client = requireSupabase();

  const { error: entryError } = await client.from('certified_entries').insert({
    entry_type: 'product',
    barcode: submission.barcode,
    product_name: submission.productName,
    brand: submission.brand,
    category: submission.category,
    status: submission.suggestedStatus,
    certifier_id: 'halalzur',
    certificate_number: null,
    verified_at: new Date().toISOString().slice(0, 10),
    ingredients: submission.ingredients,
    notes: submission.notes,
    source_url: null,
  });
  if (entryError) throw entryError;

  const { error: reviewError } = await client
    .from('product_submissions')
    .update({ review_status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', submission.id);
  if (reviewError) throw reviewError;

  await awardPoints(client, submission.submittedBy, submission.submittedByName);
}

export async function rejectSubmission(submissionId: string, adminNotes: string | null): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('product_submissions')
    .update({ review_status: 'rejected', reviewed_at: new Date().toISOString(), admin_notes: adminNotes })
    .eq('id', submissionId);
  if (error) throw error;
}
