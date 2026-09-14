import type { TokenPayload } from "@/types/models";

export function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64);
    const payload = JSON.parse(json) as TokenPayload;
    if (!payload.sub || !payload.email || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64);
    const { exp } = JSON.parse(json) as { exp?: number };
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}
