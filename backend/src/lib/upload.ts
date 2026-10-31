import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

import { config } from "../config.js";
import { HttpError } from "./http.js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, "Format file harus JPG, PNG, WEBP, HEIC, atau PDF"));
  },
}).single("file");

export const LOCAL_UPLOAD_DIR = path.resolve("uploads");

/**
 * Simpan file. Kalau CLOUDINARY_URL diisi → upload ke Cloudinary (wajib untuk produksi,
 * karena disk server gratisan akan terhapus saat restart). Kalau kosong → simpan di folder uploads/.
 */
export async function storeFile(file: Express.Multer.File, folder: string): Promise<string> {
  if (config.cloudinaryUrl) {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `dubidu/${folder}`, resource_type: "auto" }, (err, res) =>
          err || !res ? reject(err) : resolve(res),
        )
        .end(file.buffer);
    });
    return result.secure_url;
  }

  // Vercel (serverless) tidak punya penyimpanan file permanen → wajib Cloudinary
  if (process.env.VERCEL) {
    throw new HttpError(500, "Penyimpanan file belum dikonfigurasi (isi CLOUDINARY_URL di Vercel)");
  }

  const ext = path.extname(file.originalname) || (file.mimetype === "application/pdf" ? ".pdf" : ".jpg");
  const name = `${folder}-${randomUUID()}${ext}`;
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, name), file.buffer);
  return `${config.publicUrl}/uploads/${name}`;
}
