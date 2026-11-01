import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";

import { config } from "../config.js";
import type { Role } from "../db.js";
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

/** Wajib login. Header: `Authorization: Bearer <token>` */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Silakan login terlebih dahulu");
  try {
    req.user = verifyToken(token);
  } catch {
    throw new HttpError(401, "Sesi login sudah habis, silakan login ulang");
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
