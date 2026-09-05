import { supabase, isSupabaseConfigured } from './supabase';
import { getOrClaimSyncToken } from './syncToken';

export type QaAnswer = {
  id: string;
  userId: string;
  userName: string | null;
  answer: string;
  createdAt: string;
};

export type QaQuestion = {
  id: string;
  userId: string;
  userName: string | null;
  question: string;
  createdAt: string;
  answers: QaAnswer[];
};

type QuestionRow = { id: string; user_id: string; user_name: string | null; question: string; created_at: string };
type AnswerRow = {
  id: string;
  question_id: string;
  user_id: string;
  user_name: string | null;
  answer: string;
  created_at: string;
};

export async function getQuestions(barcode: string): Promise<QaQuestion[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: questions, error } = await supabase
    .from('product_qa_questions')
    .select('id, user_id, user_name, question, created_at')
    .eq('barcode', barcode)
    .order('created_at', { ascending: false })
    .limit(30)
    .returns<QuestionRow[]>();
  if (error || !questions || questions.length === 0) return [];

  const { data: answers } = await supabase
    .from('product_qa_answers')
    .select('id, question_id, user_id, user_name, answer, created_at')
    .in('question_id', questions.map((q) => q.id))
    .order('created_at', { ascending: true })
    .returns<AnswerRow[]>();

  return questions.map((q) => ({
    id: q.id,
    userId: q.user_id,
    userName: q.user_name,
    question: q.question,
    createdAt: q.created_at,
    answers: (answers ?? [])
      .filter((a) => a.question_id === q.id)
      .map((a) => ({ id: a.id, userId: a.user_id, userName: a.user_name, answer: a.answer, createdAt: a.created_at })),
  }));
}

export async function askQuestion(userId: string, userName: string | null, barcode: string, question: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');
  const trimmed = question.trim();
  if (!trimmed) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) throw new Error('Sinxronizasiya hazır deyil, bir az sonra cəhd edin.');
  const { error } = await supabase.rpc('qa_question_add', {
    p_user_id: userId,
    p_token: token,
    p_user_name: userName,
    p_barcode: barcode,
    p_question: trimmed,
  });
  if (error) throw error;
}

export async function answerQuestion(
  userId: string,
  userName: string | null,
  questionId: string,
  answer: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');
  const trimmed = answer.trim();
  if (!trimmed) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) throw new Error('Sinxronizasiya hazır deyil, bir az sonra cəhd edin.');
  const { error } = await supabase.rpc('qa_answer_add', {
    p_user_id: userId,
    p_token: token,
    p_user_name: userName,
    p_question_id: questionId,
    p_answer: trimmed,
  });
  if (error) throw error;
}
