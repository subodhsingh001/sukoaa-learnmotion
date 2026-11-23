/** Turn anything thrown into a clean, human-readable message. */
export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return typeof e === 'string' ? e : 'Something went wrong. Please try again.';
}

export type Tone = 'success' | 'warn' | 'danger' | 'info' | 'primary' | 'neutral';

const STATUS_TONE: Record<string, Tone> = {
  draft: 'neutral', reviewed: 'info', published: 'success',
  ready: 'success', pending: 'neutral', needs_ocr: 'warn', needs_review: 'warn',
  admin: 'primary', teacher: 'info', student: 'neutral',
};
export const statusTone = (s: string): Tone => STATUS_TONE[s] ?? 'neutral';
export const statusLabel = (s: string) => s.replace(/_/g, ' ');

export const percent = (score: number, total: number) => (total ? Math.round((score / total) * 100) : 0);
export const barTone = (p: number) => (p >= 75 ? 'good' : p >= 50 ? 'warn' : 'bad');

export const KIND_LABEL: Record<string, string> = {
  notes: 'Notes', qa: 'Q&A sets', quiz: 'Quizzes', exercise: 'Exercises', video: 'Animated lessons',
};

export type QuestionSet = {
  format: 'question_set_v1';
  questions: { question: string; answer: string; options: string[]; correct_option: number | null; explanation: string }[];
};
export function parseQuestionSet(body: string): QuestionSet | null {
  try {
    const d = JSON.parse(body);
    return d && d.format === 'question_set_v1' && Array.isArray(d.questions) ? d : null;
  } catch { return null; }
}

export const homeFor = (role: string) => (role === 'super_admin' ? '/super-admin' : role === 'admin' ? '/school-admin' : role === 'teacher' ? '/teacher' : '/my-learning');
