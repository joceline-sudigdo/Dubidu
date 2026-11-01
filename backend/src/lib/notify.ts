import { Expo, type ExpoPushMessage } from "expo-server-sdk";

import { config } from "../config.js";
import { prisma, type NotificationCategory } from "../db.js";
import { emitToUser } from "./realtime.js";

type NotifyInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  icon?: string;
  tone?: "blue" | "green" | "red" | "yellow" | "gray";
  tag?: string;
  action?: string;
  link?: string;
};

/** Saluran notifikasi Android (harus sama dengan yang dibuat di aplikasi) */
const ANDROID_CHANNEL: Record<NotificationCategory, string> = {
  CHAT: "chat",
  BOOKING: "booking",
  LAPORAN: "laporan",
  LAINNYA: "default",
};

let expo: Expo | null = null;
function expoClient() {
  expo ??= new Expo({ accessToken: config.expoAccessToken });
  return expo;
}

/** Simpan notifikasi ke database, kirim realtime (Socket.IO), dan push ke semua HP user. */
export async function notify(input: NotifyInput) {
  const notification = await prisma.notification.create({ data: input });
  emitToUser(input.userId, "notification:new", notification);
  void sendPush(input).catch((err) => console.error("Push gagal:", err));
  return notification;
}

/** Kirim notifikasi yang sama ke semua akun ADMIN (mis. ada bukti transfer baru). */
export async function notifyAdmins(input: Omit<NotifyInput, "userId">) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  await Promise.all(admins.map((a) => notify({ ...input, userId: a.id })));
}

/** Kirim push lewat Expo Push Service. Token yang sudah tidak valid otomatis dihapus. */
export async function sendPush(input: NotifyInput) {
  const devices = await prisma.deviceToken.findMany({ where: { userId: input.userId } });
  if (devices.length === 0) return;

  const unread = await prisma.notification.count({ where: { userId: input.userId, readAt: null } });
  const messages: ExpoPushMessage[] = devices
    .filter((d) => Expo.isExpoPushToken(d.token))
    .map((d) => ({
      to: d.token,
      title: input.title,
      body: input.body,
      sound: "default",
      badge: unread,
      channelId: ANDROID_CHANNEL[input.category],
      data: { link: input.link, category: input.category },
    }));

  const client = expoClient();
  for (const chunk of client.chunkPushNotifications(messages)) {
    const tickets = await client.sendPushNotificationsAsync(chunk);
    for (const [i, ticket] of tickets.entries()) {
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        await prisma.deviceToken.deleteMany({ where: { token: chunk[i]!.to as string } });
      }
    }
  }
}
