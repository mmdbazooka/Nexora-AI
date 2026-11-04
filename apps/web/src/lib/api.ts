import type { ApiResult } from '@nexora/shared';
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}
let csrfToken: string | undefined;
let csrfPending: Promise<string> | null = null;
let refreshPending: Promise<boolean> | null = null;
export async function securityToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!csrfPending)
    csrfPending = fetch('/api/v1/auth/csrf', { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok)
          throw new ApiError('Cannot connect to the workspace API. Please try again.', r.status);
        const result = await r.json();
        csrfToken = result.data.token;
        return csrfToken!;
      })
      .finally(() => {
        csrfPending = null;
      });
  return csrfPending;
}
export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const method = options.method || 'GET';
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD'].includes(method)) headers.set('X-CSRF-Token', await securityToken());
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Cannot reach Nexora. Check your connection and try again.', 0);
  }
  if (
    response.status === 401 &&
    retry &&
    !['/auth/refresh', '/auth/login', '/auth/register'].includes(path)
  ) {
    if (!refreshPending)
      refreshPending = api('/auth/refresh', { method: 'POST' }, false)
        .then(() => true)
        .catch(() => false)
        .finally(() => {
          refreshPending = null;
        });
    if (await refreshPending) return api<T>(path, options, false);
  }
  const result = await response
    .json()
    .catch(() => ({ error: { message: 'The service is unavailable. Please try again shortly.' } }));
  if (!response.ok) {
    if (
      response.status === 401 &&
      (!path.startsWith('/auth/') || path === '/auth/me' || path === '/auth/refresh') &&
      typeof window !== 'undefined'
    )
      window.dispatchEvent(new Event('nexora:unauthorized'));
    if (response.status === 403 && result.error?.code === 'CSRF_ERROR') csrfToken = undefined;
    throw new ApiError(
      result.error?.message || 'Request failed',
      response.status,
      result.error?.code,
    );
  }
  return result.data as T;
}
export async function paged<T>(path: string) {
  // Lists request the API's supported maximum; search/filter controls are sent to the server.
  return api<T[]>(path + (path.includes('?') ? '&' : '?') + 'limit=100');
}
export function json(method: string, body?: unknown): RequestInit {
  return { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) };
}
export type { ApiResult };
