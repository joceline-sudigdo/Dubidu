import nodemailer from "nodemailer";

import { config } from "../config.js";

/**
 * Kirim email lewat SMTP (Gmail App Password, Brevo, Mailtrap, dll).
 * Kalau SMTP belum diisi, email hanya dicetak ke log server (untuk pengembangan).
 */
export async function sendMail(to: string, subject: string, html: string, text: string) {
  const smtp = config.smtp;
  if (!smtp.host || !smtp.user || !smtp.pass) {
    console.log(`[email belum dikonfigurasi] Ke: ${to} | ${subject}\n${text}`);
    return { delivered: false };
  }
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  await transporter.sendMail({ from: smtp.from, to, subject, html, text });
  return { delivered: true };
}

export function resetPasswordEmail(name: string, code: string) {
  const text = `Halo ${name},\n\nKode untuk mengatur ulang password DUBIDU kamu: ${code}\nKode berlaku 15 menit. Jangan bagikan kode ini ke siapa pun.\n\nKalau kamu tidak meminta reset password, abaikan email ini.\n\nSalam hangat,\nTim DUBIDU`;
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#FAF3E8;border-radius:24px;color:#2C3E50">
    <h2 style="margin:0 0 8px">Halo, ${escapeHtml(name)} 🐻‍❄️</h2>
    <p>Gunakan kode berikut untuk mengatur ulang password DUBIDU kamu:</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#fff;padding:16px;border-radius:16px;text-align:center">${code}</p>
    <p>Kode berlaku <b>15 menit</b>. Jangan bagikan kode ini ke siapa pun.</p>
    <p style="font-size:12px;color:#7a8794">Kalau kamu tidak meminta reset password, abaikan email ini.</p>
  </div>`;
  return { subject: `${code} adalah kode reset password DUBIDU`, html, text };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
