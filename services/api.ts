// Base URL for the FastAPI backend.
// iOS Simulator on the same Mac → 127.0.0.1 works fine.
// Physical device → replace with your machine's local IP, e.g. http://192.168.1.x:8000
export const BASE_URL = 'http://172.20.10.4:8000';

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

export function getAuthToken(): string | null {
  return _token;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000); // 10 s timeout

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({ detail: 'No response body' }));

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
  delete: <T>(path: string)                  => request<T>('DELETE', path),
};
