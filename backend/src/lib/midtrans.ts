// Integrasi Midtrans Snap
// Docs: https://docs.midtrans.com/docs/snap-snap-integration-guide
//       https://docs.midtrans.com/docs/https-notification-webhooks
import { createHash } from "node:crypto";

import { config } from "../config.js";
import { HttpError } from "./http.js";

function baseUrls() {
  return config.midtransIsProduction
    ? { snap: "https://app.midtrans.com/snap/v1/transactions", api: "https://api.midtrans.com/v2" }
    : { snap: "https://app.sandbox.midtrans.com/snap/v1/transactions", api: "https://api.sandbox.midtrans.com/v2" };
}

function authHeader() {
  const key = config.midtransServerKey;
  if (!key) throw new HttpError(500, "MIDTRANS_SERVER_KEY belum diisi di server");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export type SnapInput = {
  orderId: string;
  amount: number;
  itemName: string;
  customer: { name: string; email?: string | null; phone?: string | null };
  expiryMinutes: number;
  finishUrl?: string;
};

/** Buat transaksi Snap → { token, redirect_url } */
export async function createSnapTransaction(input: SnapInput) {
  const res = await fetch(baseUrls().snap, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      item_details: [{ id: input.orderId, price: input.amount, quantity: 1, name: input.itemName.slice(0, 50) }],
      customer_details: {
        first_name: input.customer.name.slice(0, 50),
        email: input.customer.email ?? undefined,
        phone: input.customer.phone ?? undefined,
      },
      credit_card: { secure: true },
      expiry: { unit: "minutes", duration: Math.max(1, input.expiryMinutes) },
      callbacks: input.finishUrl ? { finish: input.finishUrl } : undefined,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; redirect_url?: string; error_messages?: string[] };
  if (!res.ok || !data.token) {
    console.error("Midtrans error", res.status, data);
    throw new HttpError(502, `Gagal membuat transaksi Midtrans: ${data.error_messages?.join(", ") ?? res.status}`);
  }
  return { token: data.token, redirectUrl: data.redirect_url! };
}

export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  [key: string]: unknown;
};

/** signature_key = SHA512(order_id + status_code + gross_amount + ServerKey) */
export function verifySignature(n: MidtransNotification) {
  const key = config.midtransServerKey;
  if (!key) return false;
  const expected = createHash("sha512").update(`${n.order_id}${n.status_code}${n.gross_amount}${key}`).digest("hex");
  return expected === n.signature_key;
}

/** Ubah status Midtrans → status pembayaran kita */
export function mapStatus(transactionStatus: string, fraudStatus?: string): "PAID" | "PENDING" | "FAILED" | "EXPIRED" | null {
  switch (transactionStatus) {
    case "settlement":
      return "PAID";
    case "capture":
      return !fraudStatus || fraudStatus === "accept" ? "PAID" : "PENDING";
    case "pending":
    case "authorize":
      return "PENDING";
    case "deny":
    case "cancel":
    case "failure":
      return "FAILED";
    case "expire":
      return "EXPIRED";
    default:
      return null; // refund dll. — dicatat saja
  }
}

/** Cek status langsung ke Midtrans (dipakai untuk tombol "Cek status pembayaran") */
export async function getTransactionStatus(orderId: string) {
  const res = await fetch(`${baseUrls().api}/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: authHeader() },
  });
  return (await res.json()) as MidtransNotification;
}
