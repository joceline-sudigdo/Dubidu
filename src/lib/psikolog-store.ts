import * as WebBrowser from 'expo-web-browser';
import { useSyncExternalStore } from 'react';

import {
  applicants,
  type Applicant,
  type Consultation,
  type ConsultReport,
  type VerifyResult,
} from '@/data/psychologist';

import { api, errorMessage } from './api';
import { addMessage } from './chat-store';
import { showAlert } from './dialog';

// status konsultasi & hasil verifikasi; keputusan, jadwal interview, dan laporan dikirim ke server
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
  api(`/consultations/${c.id}/result`, {
    method: 'PATCH',
    body: { observation: report.note, recommendation: report.recommendations.join(', ') || '-' },
  }).catch((e) => showAlert('Laporan belum tersimpan di server', errorMessage(e)));
  set({
    ...state,
    status: { ...state.status, [c.id]: 'done' },
    reports: { ...state.reports, [c.id]: report },
  });
  if (!c.chatId) return; // ringkasan juga dikirim di chat kalau ada room-nya
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
}

// rekomendasi psikolog untuk admin (keputusan akhir verifikasi tetap di web admin)
export function decideApplicant(id: string, decision: VerifyResult) {
  set({ ...state, decisions: { ...state.decisions, [id]: decision } });
  api(`/psychologists/me/teacher-applicants/${id}`, { method: 'PUT', body: decision }).catch((e) =>
    showAlert('Rekomendasi belum tersimpan', errorMessage(e))
  );
}

export function scheduleInterview(id: string, value: string) {
  set({ ...state, interviews: { ...state.interviews, [id]: value } });
  api(`/psychologists/me/teacher-applicants/${id}`, { method: 'PUT', body: { interview: value } }).catch((e) =>
    showAlert('Jadwal interview belum tersimpan', errorMessage(e))
  );
}

/** Buka ruang video/voice call (Daily / Jitsi) di browser; bisa mulai 15 menit sebelum jadwal */
export async function joinConsultation(id: string) {
  try {
    const { url } = await api<{ url: string }>(`/consultations/${id}/join`);
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch (e) {
    showAlert('Ruang konsultasi belum bisa dibuka', errorMessage(e));
    return false;
  }
}
