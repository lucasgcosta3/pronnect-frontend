import { getToken } from "./auth";
import type { ApiErrorBody } from "./types";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "https://pronnect-api-production.up.railway.app";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function extractMessage(status: number, body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string" && status >= 500) return o.error;
    const fieldErrors = Object.entries(o).filter(
      ([, v]) => typeof v === "string"
    );
    if (fieldErrors.length > 0) {
      return fieldErrors.map(([k, v]) => `${k}: ${v}`).join("; ");
    }
  }
  if (typeof body === "string" && body.length < 200) return body;
  return fallback;
}

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };

  if (init?.json !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    body:
      init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });

  if (!res.ok) {
    const text = await res.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    const msg = extractMessage(
      res.status,
      body,
      (body as ApiErrorBody)?.message || res.statusText
    );
    throw new ApiError(res.status, msg, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const ct = res.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
