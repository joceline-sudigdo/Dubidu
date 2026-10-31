import { useSyncExternalStore } from 'react';

import { doobieFallback, doobieTopics, doobieVoiceReply, type DoobieTopic } from '@/data/doobie';
import type { PlusRole } from '@/data/plus';

import { getSession } from './session';

// percakapan dengan Doobie (memori, per role). jawaban diambil dari template data/doobie.ts
export type DoobieMessage =
  | { id: string; from: 'me' | 'doobie'; type: 'text'; text: string }
  | { id: string; from: 'me'; type: 'voice'; uri: string; durationMs: number };

type State = { messages: Record<PlusRole, DoobieMessage[]>; typing: boolean };

let state: State = { messages: { parent: [], teacher: [] }, typing: false };
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

const role = (): PlusRole => (getSession().role === 'teacher' ? 'teacher' : 'parent');
let seq = 0;
const newId = () => `d-${Date.now()}-${seq++}`;

export function useDoobie() {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
  return { messages: s.messages[role()], typing: s.typing, topics: doobieTopics[role()] };
}

function push(message: DoobieMessage) {
  const r = role();
  set({ ...state, messages: { ...state.messages, [r]: [...state.messages[r], message] } });
}

// Doobie "mengetik" dulu, lalu kirim jawaban satu per satu
function reply(parts: string[]) {
  set({ ...state, typing: true });
  parts.forEach((text, i) => {
    setTimeout(
      () => {
        push({ id: newId(), from: 'doobie', type: 'text', text });
        if (i === parts.length - 1) set({ ...state, typing: false });
      },
      900 + i * 1100
    );
  });
}

export function askTopic(topic: DoobieTopic) {
  if (state.typing) return;
  push({ id: newId(), from: 'me', type: 'text', text: topic.question });
  reply(topic.answer);
}

export function askText(text: string) {
  if (state.typing || !text.trim()) return;
  push({ id: newId(), from: 'me', type: 'text', text: text.trim() });
  // kalau pertanyaannya mirip salah satu topik, pakai jawaban topik itu
  const lower = text.toLowerCase();
  const match = doobieTopics[role()].find((t) => t.label.toLowerCase().split(' ').some((w) => w.length > 4 && lower.includes(w)));
  reply(match ? match.answer : doobieFallback);
}

export function sendVoice(uri: string, durationMs: number) {
  push({ id: newId(), from: 'me', type: 'voice', uri, durationMs });
  reply(doobieVoiceReply);
}

export function clearDoobie() {
  set({ ...state, messages: { ...state.messages, [role()]: [] } });
}
