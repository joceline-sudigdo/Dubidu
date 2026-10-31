import { useSyncExternalStore } from 'react';

import { chatThreads as parentThreads, type ChatMessage, type ChatThread } from '@/data/parent';
import { psychologistChatThreads } from '@/data/psychologist';
import { teacherChatThreads } from '@/data/teacher';

export type { ChatThread };

// state chat sederhana di memori, biar chat baru (misal dari Connect) muncul di daftar chat
let threads: ChatThread[] = [...parentThreads, ...teacherChatThreads, ...psychologistChatThreads];
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
  threads = exists ? threads.map((t) => (t.id === thread.id ? thread : t)) : [thread, ...threads];
  emit();
}

export function clearThread(threadId: string) {
  threads = threads.map((t) => (t.id === threadId ? { ...t, messages: [], preview: 'Belum ada pesan', unread: 0 } : t));
  emit();
}

export function addMessage(threadId: string, message: ChatMessage) {
  threads = threads.map((t) =>
    t.id === threadId
      ? {
          ...t,
          messages: [...t.messages, message],
          preview: message.type === 'text' ? message.text : message.type === 'schedule' ? 'Tawaran jadwal sesi' : 'Mengirim gambar',
          time: message.time,
        }
      : t
  );
  emit();
}
