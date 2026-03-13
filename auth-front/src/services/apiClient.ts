const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3100/api";

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  const authToken = token ?? localStorage.getItem("token") ?? undefined;

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();

  let payload: unknown = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload;
    throw new Error(errorPayload.error || errorPayload.message || `HTTP ${response.status}`);
  }

  return payload as T;
}
