import { clearSession, getSession } from "./session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new ApiError(
      data?.error?.message ?? `Request failed with ${response.status}`,
      response.status,
      data?.error?.code,
    );
  }

  return data as T;
}
