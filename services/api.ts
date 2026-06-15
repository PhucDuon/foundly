// Base URL for the FastAPI backend.
// iOS Simulator on the same Mac → 127.0.0.1 works fine.
// Physical device → replace with your machine's local IP, e.g. http://192.168.1.x:8000
export const BASE_URL = 'https://foundly-0k7n.onrender.com';

// Keep Render free tier awake — ping every 9 minutes
setInterval(() => {
  fetch(`${BASE_URL}/ping`).catch(() => {});
}, 9 * 60 * 1000);

let _token: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

export function getAuthToken(): string | null {
  return _token;
}

export function setOnUnauthorized(cb: () => void) {
  _onUnauthorized = cb;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({ detail: 'No response body' }));

    if (res.status === 401) {
      _onUnauthorized?.();
      throw new Error(data.detail ?? 'Not authenticated');
    }

    if (!res.ok) {
      throw new Error(data.detail ?? `Request failed with status ${res.status}`);
    }

    return data as T;
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new Error('Request timed out. Is the backend running?');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get:    <T>(path: string)                  => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown)  => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown)  => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body?: unknown)  => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                  => request<T>('DELETE', path),
};
