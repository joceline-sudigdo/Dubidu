// Ruang video/voice call untuk konsultasi psikolog.
// Utama: Daily.co (https://docs.daily.co) — ruang privat + token per peserta.
// Cadangan (DAILY_API_KEY kosong): link Jitsi Meet acak.
import { randomBytes } from "node:crypto";

import { config } from "../config.js";

const DAILY_API = "https://api.daily.co/v1";

async function daily<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${DAILY_API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.dailyApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Daily ${path} gagal: ${JSON.stringify(data)}`);
  return data as T;
}

const unix = (d: Date) => Math.floor(d.getTime() / 1000);

/** Buat ruang meeting untuk satu konsultasi. Dipanggil saat pembayaran lunas. */
export async function createMeetingRoom(c: { id: string; type: string; scheduledAt: Date; durationMin: number }) {
  const opensAt = new Date(c.scheduledAt.getTime() - 15 * 60000); // bisa masuk 15 menit sebelum
  const closesAt = new Date(c.scheduledAt.getTime() + (c.durationMin + 30) * 60000);
  const name = `dubidu-${c.id}`;

  if (config.dailyApiKey) {
    const room = await daily<{ name: string; url: string }>("/rooms", {
      name,
      privacy: "private",
      properties: {
        nbf: unix(opensAt),
        exp: unix(closesAt),
        eject_at_room_exp: true,
        enable_chat: true,
        enable_prejoin_ui: true,
        start_video_off: c.type === "CALL", // panggilan suara: kamera mati di awal
        max_participants: 4,
        lang: "id",
      },
    });
    return { provider: "daily", room: room.name, url: room.url };
  }

  return { provider: "jitsi", room: name, url: `https://meet.jit.si/${name}-${randomBytes(6).toString("hex")}` };
}

/** Link masuk untuk satu peserta. Daily: ditambah token privat (?t=...). */
export async function joinUrl(
  meeting: { provider: string | null; room: string | null; url: string | null },
  user: { name: string; isOwner: boolean; type: string },
  closesAt: Date,
) {
  if (!meeting.url) return null;
  if (meeting.provider === "daily" && config.dailyApiKey && meeting.room) {
    const { token } = await daily<{ token: string }>("/meeting-tokens", {
      properties: {
        room_name: meeting.room,
        user_name: user.name,
        is_owner: user.isOwner,
        exp: unix(closesAt),
        start_video_off: user.type === "CALL",
      },
    });
    return `${meeting.url}?t=${token}`;
  }
  return `${meeting.url}#userInfo.displayName="${encodeURIComponent(user.name)}"${user.type === "CALL" ? "&config.startWithVideoMuted=true" : ""}`;
}
