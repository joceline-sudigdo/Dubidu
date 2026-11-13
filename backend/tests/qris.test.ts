// Uji QRIS dinamis (tanpa database): CRC, validasi, sisip nominal, dan baca gambar QR.
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import QRCode from "qrcode";

import { crc16, dynamicQris, normalizeQris, qrisFromPng, qrisMerchantName } from "../src/lib/qris.js";

// QRIS statis contoh (merchant fiktif) yang disusun mengikuti format EMV + CRC yang benar
const tlv = (tag: string, value: string) => `${tag}${String(value.length).padStart(2, "0")}${value}`;
const body =
  tlv("00", "01") +
  tlv("01", "11") +
  tlv("26", tlv("00", "ID.CO.CONTOH.WWW") + tlv("01", "936000000000000001") + tlv("02", "CONTOH0001") + tlv("03", "UMI")) +
  tlv("51", tlv("00", "ID.CO.QRIS.WWW") + tlv("02", "ID1020000000001") + tlv("03", "UMI")) +
  tlv("52", "8299") +
  tlv("53", "360") +
  tlv("58", "ID") +
  tlv("59", "DUBIDU CONTOH") +
  tlv("60", "MALANG") +
  tlv("61", "65141") +
  "6304";
const STATIC_QRIS = body + crc16(body);

describe("QRIS dinamis", () => {
  it("CRC16-CCITT sesuai nilai acuan", () => {
    assert.equal(crc16("123456789"), "29B1");
  });

  it("menerima QRIS yang sah dan menolak yang rusak", () => {
    assert.equal(normalizeQris(`  ${STATIC_QRIS}\n`), STATIC_QRIS);
    assert.equal(normalizeQris(STATIC_QRIS.slice(0, -1) + "0"), null); // CRC salah
    assert.equal(normalizeQris("https://example.com/bukan-qris"), null);
    assert.equal(qrisMerchantName(STATIC_QRIS), "DUBIDU CONTOH");
  });

  it("menyisipkan nominal: jadi sekali pakai, nominal terisi, CRC dihitung ulang", () => {
    const dynamic = dynamicQris(STATIC_QRIS, 59032)!;
    assert.ok(dynamic.startsWith("000201010212"), "tag 01 menjadi 12 (dinamis)");
    assert.ok(dynamic.includes("540559032"), "tag 54 berisi nominal");
    assert.equal(normalizeQris(dynamic), dynamic, "CRC baru sah");
    assert.equal(qrisMerchantName(dynamic), "DUBIDU CONTOH", "data merchant tidak berubah");
    // nominal lain → QR lain; sumber yang sudah dinamis pun bisa dipakai ulang
    assert.ok(dynamicQris(dynamic, 160000)!.includes("5406160000"));
    assert.equal(dynamicQris(STATIC_QRIS, 0), null);
    assert.equal(dynamicQris("bukan qris", 1000), null);
  });

  it("membaca teks QRIS dari gambar QR (PNG)", async () => {
    const png = await QRCode.toBuffer(STATIC_QRIS, { type: "png", width: 600, margin: 2 });
    assert.equal(qrisFromPng(png), STATIC_QRIS);
    assert.equal(qrisFromPng(Buffer.from("bukan gambar")), null);
  });
});
