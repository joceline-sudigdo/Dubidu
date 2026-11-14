import "server-only";

// Batas percobaan login per email (memori proses). Nanti sebaiknya dijaga juga di backend.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; firstAt: number }>();

export function loginBlockedFor(key: string) {
  const entry = attempts.get(key);
  if (!entry) return 0;
  const remaining = entry.firstAt + WINDOW_MS - Date.now();
  if (remaining <= 0) {
    attempts.delete(key);
    return 0;
  }
  return entry.count >= MAX_ATTEMPTS ? Math.ceil(remaining / 60000) : 0;
}

export function recordFailedLogin(key: string) {
  const entry = attempts.get(key);
  if (!entry || entry.firstAt + WINDOW_MS < Date.now()) attempts.set(key, { count: 1, firstAt: Date.now() });
  else entry.count += 1;
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}
