import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";

import { config } from "../config.js";
import { prisma, type Role } from "../db.js";
import { HttpError } from "./http.js";

export type AuthUser = { id: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
  return { id: String(payload.sub), role: payload.role as Role };
}

const ACTIVE_EVERY_MS = 10 * 60 * 1000;

// Status akun (aktif / tidak) disimpan sebentar di memori server supaya tidak perlu
// bertanya ke database di setiap request. Suspend dari web admin langsung menghapus
// cache di server yang sama; di server lain paling lama berlaku setelah STATUS_TTL_MS.
const STATUS_TTL_MS = 30 * 1000;
const statusCache = new Map<string, { isActive: boolean; lastActiveAt: number; checkedAt: number }>();

/** Dipanggil saat status akun berubah (suspend / aktifkan / hapus akun) */
export function forgetUserStatus(userId: string) {
  statusCache.delete(userId);
}

/** Wajib login. Header: `Authorization: Bearer <token>`. Akun yang dinonaktifkan admin langsung ditolak. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Silakan login terlebih dahulu");
  try {
    req.user = verifyToken(token);
  } catch {
    throw new HttpError(401, "Sesi login sudah habis, silakan login ulang");
  }
  const now = Date.now();
  let status = statusCache.get(req.user.id);
  if (!status || now - status.checkedAt > STATUS_TTL_MS) {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isActive: true, lastActiveAt: true } });
    if (!user) throw new HttpError(401, "Akun tidak ditemukan, silakan login ulang");
    status = { isActive: user.isActive, lastActiveAt: user.lastActiveAt?.getTime() ?? 0, checkedAt: now };
    statusCache.set(req.user.id, status);
    if (statusCache.size > 5000) statusCache.clear(); // jaga memori di server yang hidup lama
  }
  if (!status.isActive) throw new HttpError(403, "Akun dinonaktifkan, hubungi admin");
  // "terakhir aktif" untuk web admin, cukup diperbarui paling sering 10 menit sekali (tanpa menunggu)
  if (now - status.lastActiveAt > ACTIVE_EVERY_MS) {
    status.lastActiveAt = now;
    void prisma.user.update({ where: { id: req.user.id }, data: { lastActiveAt: new Date(now) } }).catch(() => {});
  }
  next();
}

/** Batasi route untuk role tertentu, contoh: `requireRole("TEACHER")` */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, "Fitur ini tidak tersedia untuk akunmu");
    }
    next();
  };
}

/** `req.user` yang sudah pasti ada (dipakai setelah requireAuth). */
export function me(req: Request): AuthUser {
  if (!req.user) throw new HttpError(401, "Silakan login terlebih dahulu");
  return req.user;
}
