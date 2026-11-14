import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

// Sesi admin: cookie httpOnly berisi payload kecil yang ditandatangani HMAC-SHA256.
export const SESSION_COOKIE = "dubidu_admin_session";
const MAX_AGE_SECONDS = 8 * 60 * 60; // 8 jam, cukup untuk satu shift kerja

// token = JWT backend DUBIDU (role ADMIN). Cookie httpOnly → tidak bisa dibaca JavaScript di browser.
type SessionPayload = { adminId: string; token: string; exp: number };

const sign = (data: string) => createHmac("sha256", env.sessionSecret).update(data).digest("base64url");

function encode(payload: SessionPayload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    return payload.exp > Date.now() / 1000 && payload.token ? payload : null;
  } catch {
    return null;
  }
}

export async function createSession(adminId: string, token: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  (await cookies()).set(SESSION_COOKIE, encode({ adminId, token, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readSession() {
  return decode((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
