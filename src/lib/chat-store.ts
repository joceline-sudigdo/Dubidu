import { useSyncExternalStore } from 'react';

import type { ChatMessage, ChatThread } from '@/data/parent';

import { api, errorMessage, uploadFile } from './api';
import { showAlert } from './dialog';
import { getSession } from './session';

export type { ChatThread };

// daftar chat dari server (GET /conversations); isi pesan dimuat saat room chat dibuka
let threads: ChatThread[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useChatThreads() {
  return useSyncExternalStore(subscribe, () => threads);
}

export function getThread(id: string) {
  return threads.find((t) => t.id === id);
}

export function upsertThread(thread: ChatThread) {
  const exists = threads.some((t) => t.id === thread.id);
  threads = exists ? threads.map((t) => (t.id === thread.id ? { ...thread, messages: thread.messages.length ? thread.messages : t.messages } : t)) : [thread, ...threads];
  emit();
}

export function clearThread(threadId: string) {
  threads = threads.map((t) => (t.id === threadId ? { ...t, messages: [], preview: 'Belum ada pesan', unread: 0 } : t));
  emit();
}

const previewOf = (m: ChatMessage) => (m.type === 'text' ? m.text : m.type === 'schedule' ? 'Tawaran jadwal sesi' : 'Mengirim gambar');

function appendLocal(threadId: string, message: ChatMessage) {
  threads = threads.map((t) =>
    t.id === threadId
      ? { ...t, messages: [...t.messages, message], preview: previewOf(message), time: message.time }
      : t
  );
  emit();
}

// ---------------------------------------------------------------------------
//  Sinkron dengan server
// ---------------------------------------------------------------------------

type ServerThread = {
  id: string;
  type: 'TEACHER' | 'PSYCHOLOGIST';
  partner: { id: string; name: string; role: string; avatarUrl: string | null; verified: boolean };
  child: string | null;
  preview: string;
  time: string;
  unread: number;
  done?: boolean;
  muted?: boolean;
};

type ServerMessage = {
  id: string;
  from: 'me' | 'them';
  type: 'text' | 'image' | 'schedule';
  text: string | null;
  uri: string | null;
  time: string;
  createdAt: string;
  // pesan jadwal: kolom jadwal ada langsung di objek pesan
  title?: string;
  date?: string;
  hours?: string;
  place?: string;
  read?: boolean;
};

function toMessage(m: ServerMessage): ChatMessage {
  if (m.type === 'image') return { id: m.id, from: m.from, type: 'image', uri: m.uri ?? '', time: m.time, read: m.read };
  if (m.type === 'schedule') {
    return { id: m.id, from: m.from, type: 'schedule', time: m.time, title: m.title ?? '', date: m.date ?? '', hours: m.hours ?? '', place: m.place ?? '' };
  }
  return { id: m.id, from: m.from, type: 'text', text: m.text ?? '', time: m.time, read: m.read };
}

/** Bisukan / aktifkan notifikasi chat (PATCH /conversations/:id/mute). true = berhasil */
export async function setThreadMuted(threadId: string, muted: boolean) {
  const before = threads;
  threads = threads.map((t) => (t.id === threadId ? { ...t, muted } : t));
  emit();
  try {
    await api(`/conversations/${threadId}/mute`, { method: 'PATCH', body: { muted } });
    return true;
  } catch (e) {
    threads = before;
    emit();
    showAlert('Pengaturan chat belum tersimpan', errorMessage(e));
    return false;
  }
}

const lastSeen: Record<string, string> = {}; // createdAt pesan terakhir per room (untuk ?after=)

export async function loadThreads() {
  const owner = getSession().role;
  const rows = await api<ServerThread[]>('/conversations');
  threads = rows.map((r) => ({
    id: r.id,
    name: r.partner.name,
    role: r.partner.role,
    verified: r.partner.verified,
    online: false,
    child: r.child ?? '',
    preview: r.preview,
    time: r.time,
    unread: r.unread,
    owner,
    done: r.done,
    muted: r.muted ?? false,
    messages: threads.find((t) => t.id === r.id)?.messages ?? [],
  }));
  emit();
}

/** Muat isi room chat lalu tandai sudah dibaca */
export async function loadMessages(threadId: string) {
  const rows = await api<ServerMessage[]>(`/conversations/${threadId}/messages`);
  if (rows.length) lastSeen[threadId] = rows[rows.length - 1].createdAt;
  threads = threads.map((t) => (t.id === threadId ? { ...t, messages: rows.map(toMessage), unread: 0 } : t));
  emit();
  api(`/conversations/${threadId}/read`, { body: {} }).catch(() => {});
}

/** Cek pesan baru tiap beberapa detik selama room chat terbuka (server Vercel tanpa websocket) */
export function pollMessages(threadId: string, everyMs = 4000) {
  const timer = setInterval(async () => {
    try {
      const after = lastSeen[threadId];
      const rows = await api<ServerMessage[]>(`/conversations/${threadId}/messages${after ? `?after=${encodeURIComponent(after)}` : ''}`);
      const fresh = rows.filter((r) => !getThread(threadId)?.messages.some((m) => m.id === r.id));
      if (rows.length) lastSeen[threadId] = rows[rows.length - 1].createdAt;
      if (!fresh.length) return;
      fresh.map(toMessage).forEach((m) => appendLocal(threadId, m));
      api(`/conversations/${threadId}/read`, { body: {} }).catch(() => {});
    } catch {
      // koneksi putus sebentar → coba lagi di putaran berikutnya
    }
  }, everyMs);
  return () => clearInterval(timer);
}

/**
 * Tambah pesan ke room. Pesan dari "me" ikut dikirim ke server (foto diunggah dulu).
 * Kalau gagal terkirim, pesan ditarik lagi dan pengguna diberi tahu.
 */
export function addMessage(threadId: string, message: ChatMessage) {
  appendLocal(threadId, message);
  if (message.from !== 'me') return;
  (async () => {
    let body: unknown;
    if (message.type === 'text') body = { type: 'TEXT', text: message.text };
    else if (message.type === 'image') body = { type: 'IMAGE', imageUrl: await uploadFile(message.uri, 'chat') };
    else body = { type: 'SCHEDULE', schedule: { title: message.title, date: message.date, hours: message.hours, place: message.place } };
    const saved = await api<ServerMessage>(`/conversations/${threadId}/messages`, { body });
    lastSeen[threadId] = saved.createdAt;
    // ganti id sementara dengan id dari server supaya polling tidak menggandakan pesan
    threads = threads.map((t) =>
      t.id === threadId ? { ...t, messages: t.messages.map((m) => (m.id === message.id ? toMessage(saved) : m)) } : t
    );
    emit();
  })().catch((e) => {
    threads = threads.map((t) => (t.id === threadId ? { ...t, messages: t.messages.filter((m) => m.id !== message.id) } : t));
    emit();
    showAlert('Pesan belum terkirim', errorMessage(e));
  });
}

export function resetChats() {
  threads = [];
  emit();
}
