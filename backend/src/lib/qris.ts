// QRIS dinamis: kode QRIS statis milik merchant (teks di dalam gambar QR) diubah menjadi
// QRIS yang nominalnya sudah terisi, jadi pembayar tidak perlu mengetik jumlah transfer.
// Format QRIS = EMV QR Code: deretan [tag 2 digit][panjang 2 digit][isi], ditutup tag 63 (CRC16).

import jsqrModule from "jsqr";
import { PNG } from "pngjs";

// jsqr dibundel sebagai CommonJS: tergantung cara modul dimuat, fungsinya ada di `.default` atau langsung di modulnya
type JsQR = (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
const jsQR: JsQR = (jsqrModule as unknown as { default?: JsQR }).default ?? (jsqrModule as unknown as JsQR);

type Field = { tag: string; value: string };

/** Pecah teks QRIS menjadi daftar field tingkat atas. null kalau formatnya rusak. */
function parseFields(payload: string): Field[] | null {
  const fields: Field[] = [];
  let i = 0;
  while (i < payload.length) {
    const tag = payload.slice(i, i + 2);
    const length = Number(payload.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(tag) || !Number.isInteger(length)) return null;
    const value = payload.slice(i + 4, i + 4 + length);
    if (value.length !== length) return null;
    fields.push({ tag, value });
    i += 4 + length;
  }
  return fields;
}

const field = ({ tag, value }: Field) => `${tag}${String(value.length).padStart(2, "0")}${value}`;

/** CRC16-CCITT (awal 0xFFFF, polinomial 0x1021) → 4 digit heksadesimal huruf besar */
export function crc16(text: string) {
  let crc = 0xffff;
  for (const char of text) {
    crc ^= char.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Rapikan & periksa teks QRIS (format benar + CRC cocok). Balikan teks bersih, atau null kalau bukan QRIS yang sah. */
export function normalizeQris(raw: string): string | null {
  const payload = raw.trim();
  const fields = parseFields(payload);
  if (!fields || fields[0]?.tag !== "00" || fields.at(-1)?.tag !== "63") return null;
  if (!fields.some((f) => f.tag === "58" && f.value === "ID")) return null; // QRIS = kode negara Indonesia
  const body = payload.slice(0, -4); // semua sebelum 4 digit CRC, termasuk "6304"
  return crc16(body) === fields.at(-1)!.value.toUpperCase() ? payload : null;
}

/**
 * QRIS statis → QRIS dinamis dengan nominal tertentu.
 * Tag 01 diubah ke "12" (sekali pakai), tag 54 (nominal) disisipkan, lalu CRC dihitung ulang.
 */
export function dynamicQris(staticPayload: string, amount: number): string | null {
  const payload = normalizeQris(staticPayload);
  if (!payload || !Number.isInteger(amount) || amount <= 0) return null;
  const kept = parseFields(payload)!.filter((f) => !["01", "54", "63"].includes(f.tag));
  const all = [...kept, { tag: "01", value: "12" }, { tag: "54", value: String(amount) }].sort((a, b) => a.tag.localeCompare(b.tag));
  const body = `${all.map(field).join("")}6304`;
  return body + crc16(body);
}

/** Nama merchant di dalam QRIS (tag 59), untuk ditampilkan ke admin sebagai pengecekan */
export function qrisMerchantName(payload: string) {
  return parseFields(payload)?.find((f) => f.tag === "59")?.value ?? null;
}

/** Baca teks QRIS dari gambar PNG berisi QR. null kalau tidak terbaca / bukan QRIS. */
export function qrisFromPng(buffer: Buffer): string | null {
  try {
    const png = PNG.sync.read(buffer);
    const found = jsQR(new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length), png.width, png.height);
    return found ? normalizeQris(found.data) : null;
  } catch {
    return null;
  }
}

/**
 * Baca teks QRIS dari URL gambar QR yang diunggah admin.
 * Gambar di Cloudinary diminta dalam bentuk PNG berukuran wajar supaya ringan dibaca.
 */
export async function qrisFromImageUrl(url: string): Promise<string | null> {
  try {
    const pngUrl = url.includes("res.cloudinary.com") ? url.replace("/upload/", "/upload/f_png,w_1000,c_limit/") : url;
    const res = await fetch(pngUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return qrisFromPng(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
}
