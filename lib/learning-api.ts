export const API = process.env.NEXT_PUBLIC_SUKOAA_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'sukoaa:access_token';
export function getToken() { return typeof window === 'undefined' ? null : sessionStorage.getItem(TOKEN_KEY); }
export function setToken(token: string) { sessionStorage.setItem(TOKEN_KEY, token); }
export function logout() { sessionStorage.removeItem(TOKEN_KEY); }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
  response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    cache: 'no-store',
  });
  } catch {
    throw new Error('Cannot reach the SUKOAA server. Make sure the backend is running on ' + API);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && token && !path.startsWith('/auth/')) {
      logout();
      throw new Error('Your session has expired. Please sign in again.');
    }
    const detail = Array.isArray(data.detail) ? data.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('; ') : data.detail;
    throw new Error(typeof detail === 'string' && detail ? detail : `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export async function saveLessonProgress(slug: string, score?: number, total?: number) {
  if (!getToken()) return false;
  await api(`/progress/${encodeURIComponent(slug)}`, { method: 'PUT', body: JSON.stringify({ completed: true }) });
  return true;
}

export type QuizResult = {score:number;total:number;completed:boolean};
export async function submitQuiz(slug:string, answers:number[]):Promise<QuizResult>{
 return api<QuizResult>(`/assessments/quizzes/${encodeURIComponent(slug)}/submit`,{method:'POST',body:JSON.stringify({answers})});
}

export type LessonProgressRecord = {lesson_slug:string;completed:boolean;score:number|null;total:number|null};
export async function getMyLessonProgress():Promise<LessonProgressRecord[]> {
 return api<LessonProgressRecord[]>('/progress');
}
