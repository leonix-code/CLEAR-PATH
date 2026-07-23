const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
export function setAccessToken(token: string | null) { accessToken = token; }
async function refresh(): Promise<boolean> {
  if (!refreshInFlight) refreshInFlight = fetch(`${API_URL}/v1/auth/refresh`, { method: 'POST', credentials: 'include' }).then(r => r.ok).finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}
export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers); headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });
  if (response.status === 401 && retry && path !== '/v1/auth/refresh' && await refresh()) return api<T>(path, init, false);
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message ?? 'Request failed');
  return response.json();
}
