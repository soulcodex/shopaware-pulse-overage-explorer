export interface ApiOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, options: RequestInit = {}, apiOptions: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiOptions.headers ?? {}),
      ...(options.headers ?? {}),
    },
    signal: apiOptions.signal,
  });

  if (!response.ok) {
    // In a real app, you might centralize error handling or logging here.
    const text = await response.text();
    throw new Error(`Request failed with status ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export function get<T>(path: string, apiOptions?: ApiOptions) {
  return request<T>(path, { method: 'GET' }, apiOptions);
}

export function post<T, Body = unknown>(path: string, body: Body, apiOptions?: ApiOptions) {
  return request<T>(
    path,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    apiOptions,
  );
}

