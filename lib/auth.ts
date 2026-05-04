import type { AccountRole } from "./types";

// TODO (produção): migrar token para httpOnly cookie (definido pelo backend)
// para proteção contra XSS. localStorage é aceitável para MVP.
const TOKEN_KEY = "pronnect_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export interface JwtPayload {
  sub?: string;
  role?: AccountRole;
  accountId?: string;
  name?: string;
  fullName?: string;
  exp?: number;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getRoleFromToken(): AccountRole | null {
  const t = getToken();
  if (!t) return null;
  const role = decodeJwtPayload(t)?.role;
  if (role === "PROFESSIONAL" || role === "COMPANY" || role === "ADMIN") {
    return role;
  }
  return null;
}
