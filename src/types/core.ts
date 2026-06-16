// ═══════════════════════════════════════════════════════════
// lib/api/_core.ts — Shared base for all API modules
// ═══════════════════════════════════════════════════════════

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL;

/**
 * Returns Authorization header if a token exists.
 * Returns {} safely during SSR (no window access).
 */
export const getAuthHeader = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('whisper_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Central response handler for all API calls.
 * - Parses JSON when Content-Type is application/json.
 * - On 401 (non-auth routes): clears token + redirects to /login.
 * - Throws descriptive Error on any non-2xx.
 */
export async function handleResponse<T = unknown>(
  res: Response,
  context: string
): Promise<T> {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const isPublicRoute = context === 'Login' || context === 'Register';

    if (res.status === 401 && !isPublicRoute) {
      localStorage.removeItem('whisper_token');
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        window.location.href = '/login?error=session_expired';
      }
    }

    const message =
      data?.detail ||
      data?.message ||
      `[${context}] Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}