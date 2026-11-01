import { useSyncExternalStore } from 'react';

import { parentProfile } from '@/data/parent';
import {
  applicants,
  type Applicant,
  type Consultation,
  type ConsultReport,
  type VerifyResult,
} from '@/data/psychologist';

import { addMessage } from './chat-store';

// status konsultasi & hasil verifikasi, disimpan di memori sampai backend siap
export type ConsultStatus = 'scheduled' | 'report' | 'done';

type State = {
  status: Record<string, ConsultStatus>;
  reports: Record<string, ConsultReport>;
  decisions: Record<string, VerifyResult>;
  interviews: Record<string, string>;
};

let state: State = { status: {}, reports: {}, decisions: {}, interviews: {} };
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function usePsikolog() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
}

export function statusOf(current: State, c: Consultation): ConsultStatus {
  return current.status[c.id] ?? (c.report ? 'done' : 'scheduled');
}

export function reportOf(current: State, c: Consultation) {
  return current.reports[c.id] ?? c.report;
}

export function resultOf(current: State, a: Applicant) {
  return current.decisions[a.id] ?? a.result;
}

export function interviewOf(current: State, a: Applicant) {
  return current.interviews[a.id] ?? a.interview;
}

export function pendingApplicants(current: State) {
  return applicants.filter((a) => !resultOf(current, a));
}

// sesi selesai (panggilan diakhiri / sesi onsite ditandai), lanjut tulis hasil observasi
export function finishSession(id: string) {
  set({ ...state, status: { ...state.status, [id]: 'report' } });
}

export function sendReport(c: Consultation, report: ConsultReport) {
  set({
    ...state,
    status: { ...state.status, [c.id]: 'done' },
    reports: { ...state.reports, [c.id]: report },
  });
  if (!c.chatId) return;
  const d = new Date();
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const recs = report.recommendations.length ? `\n\nRekomendasi: ${report.recommendations.join(', ')}.` : '';
  addMessage(c.chatId, {
    id: `obs-${Date.now()}`,
    from: 'me',
    type: 'text',
    text: `Hasil observasi ${c.child}:\n${report.note}${recs}`,
    time,
    read: false,
  });
  // sisi orang tua: chat dengan psikolog (demo hanya akun Devi yang punya chat psikolog)
  if (c.parent === parentProfile.fullName) {
    addMessage('amanda', {
      id: `obs-parent-${Date.now()}`,
      from: 'them',
      type: 'text',
      text: `Laporan observasi ${c.child} sudah saya kirim, Bunda. Silakan buka di Profil → Laporan Observasi Psikolog ya.`,
      time,
    });
  }
}

export function decideApplicant(id: string, decision: VerifyResult) {
  set({ ...state, decisions: { ...state.decisions, [id]: decision } });
}

export function scheduleInterview(id: string, value: string) {
  set({ ...state, interviews: { ...state.interviews, [id]: value } });
}
