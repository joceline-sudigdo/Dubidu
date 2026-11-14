import { useSyncExternalStore } from 'react';

import { observationReports, RECOMMENDATION_INFO, type ObservationReport } from '@/data/observations';
import { parentProfile } from '@/data/parent';
import { consultations, MODE_LABEL, psychologistProfile } from '@/data/psychologist';

import { usePsikolog } from './psikolog-store';

// status sudah dibaca (memori). Laporan baru dari psikolog otomatis belum dibaca.
let readIds: string[] = ['obs-cheryl'];
const listeners = new Set<() => void>();

function useRead() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => readIds
  );
}

export function markObservationRead(id: string) {
  if (readIds.includes(id)) return;
  readIds = [...readIds, id];
  listeners.forEach((l) => l());
}

// laporan contoh + laporan yang baru dikirim psikolog dari aplikasi (role psikolog) untuk orang tua ini
export function useObservations() {
  const psikolog = usePsikolog();
  const read = useRead();

  const sent: ObservationReport[] = consultations
    .filter((c) => c.parent === parentProfile.fullName && psikolog.reports[c.id])
    .map((c) => {
      const r = psikolog.reports[c.id];
      return {
        id: `obs-${c.id}`,
        consultationId: c.id,
        psychologist: psychologistProfile.name,
        psychologistTitle: 'Psikolog Anak & Sensori',
        chatId: 'amanda',
        child: c.child,
        date: c.day,
        time: c.time,
        mode: MODE_LABEL[c.mode],
        duration: '60 menit',
        complaint: c.complaint,
        summary: r.note,
        areas: [],
        strengths: [],
        concerns: [],
        recommendations: r.recommendations.map((title) => ({
          title,
          detail: RECOMMENDATION_INFO[title]?.detail ?? '',
          kind: RECOMMENDATION_INFO[title]?.kind ?? 'rumah',
        })),
        nextStep: null,
      };
    });

  const reports = [...sent.reverse(), ...observationReports];
  return { reports, isNew: (id: string) => !read.includes(id), unread: reports.filter((r) => !read.includes(r.id)).length };
}
