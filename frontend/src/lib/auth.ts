/**
 * Client-side auth state (SSR-safe).
 *
 * - JWT token  → sent as `Authorization: Bearer <token>`
 * - API key    → sent as `X-API-Key: <key>` (programmatic access from Flutter/CLI)
 * - User info  → displayed in the header
 */

const TOKEN_KEY = "revrescue_token";
const API_KEY_KEY = "revrescue_api_key";
const USER_KEY = "revrescue_user";

export interface StoredUser {
  email: string;
  role?: string;
}

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ─── JWT token ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return safeGet(TOKEN_KEY);
}

export function setToken(token: string): void {
  safeSet(TOKEN_KEY, token);
}

export function clearToken(): void {
  safeRemove(TOKEN_KEY);
}

// ─── API key ───────────────────────────────────────────────────────────────

export function getApiKey(): string | null {
  return safeGet(API_KEY_KEY);
}

export function setApiKey(key: string): void {
  safeSet(API_KEY_KEY, key);
}

export function clearApiKey(): void {
  safeRemove(API_KEY_KEY);
}

// ─── User ──────────────────────────────────────────────────────────────────

export function getStoredUser(): StoredUser | null {
  const raw = safeGet(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  safeSet(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  safeRemove(USER_KEY);
}

// ─── Composite helpers ─────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function logout(): void {
  clearToken();
  clearStoredUser();
}
