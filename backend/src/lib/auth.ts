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
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isActive: true, lastActiveAt: true } });
  if (!user) throw new HttpError(401, "Akun tidak ditemukan, silakan login ulang");
  if (!user.isActive) throw new HttpError(403, "Akun dinonaktifkan, hubungi admin");
  // "terakhir aktif" untuk web admin, cukup diperbarui paling sering 10 menit sekali
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > ACTIVE_EVERY_MS) {
    await prisma.user.update({ where: { id: req.user.id }, data: { lastActiveAt: new Date() } });
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
