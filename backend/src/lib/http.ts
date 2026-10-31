import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

import { Prisma } from "../db.js";

/** Lempar error ini dari route mana pun: `throw new HttpError(404, "Anak tidak ditemukan")` */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = "Data") => new HttpError(404, `${what} tidak ditemukan`);
export const forbidden = (msg = "Kamu tidak punya akses ke data ini") => new HttpError(403, msg);

/** Validasi body/query dengan zod; hasilnya sudah bertipe. */
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, "Data yang dikirim tidak valid", result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })));
  }
  return result.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Data yang dikirim tidak valid", details: err.issues });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ error: "Data sudah ada (duplikat)" });
    if (err.code === "P2025") return res.status(404).json({ error: "Data tidak ditemukan" });
  }
  if (err instanceof Error && err.name === "MulterError") {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan di server" });
}

/** Ambil parameter URL (`/:id`) sebagai string. */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : String(value);
}
