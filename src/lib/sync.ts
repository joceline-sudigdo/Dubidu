// Memuat data dari server ke dalam struktur data yang dipakai layar (src/data/*).
// Bentuk data di src/data/* tetap jadi "kontrak" untuk layar; isinya sekarang diganti data asli
// setiap kali login / aplikasi dibuka. Data contoh bawaan dikosongkan dulu supaya tidak tercampur.

import type { Tone } from '@/components/parent/tones';
import {
  activeMatches,
  activeTeachers,
  applications,
  chatThreads,
  notifications,
  parentProfile,
  psychologists,
  quickQuestion,
  sessionReports,
  type ActiveMatch,
  type NotificationItem,
  type Psychologist,
  type SessionReport,
} from '@/data/parent';
import {
  applicants,
  consultations,
  psychologistChatThreads,
  psychologistNotifications,
  psychologistProfile,
  type Applicant,
  type Consultation,
  type PsychologistNotification,
} from '@/data/psychologist';
import {
  activeApplications,
  seekingChildren,
  serverChildMatch,
  students,
  teacherApplications,
  teacherChatThreads,
  teacherNotifications,
  teacherProfile,
  todaySchedule,
  type Student,
  type TeacherNotification,
} from '@/data/teacher';
import { doobieTopics } from '@/data/doobie';
import { legalDocs } from '@/data/legal';
import { plusPlans, type PlusRole } from '@/data/plus';
import { connectedTeachers, serverMatch, teacherPool, type Skill } from '@/data/teachers';

import { api } from './api';
import type { UserRole } from './auth';
import { loadThreads, resetChats } from './chat-store';
import { resetChildMatching } from './child-matching-store';
import { setChildren, toChild, type ServerChild } from './children-store';
import { loadCommunity, resetCommunity } from './community-store';
import { resetMatching } from './matching-store';
import { setPlans } from './membership-store';
import { setCheckinWeek, setServerPoints } from './points-store';
import { updateSession } from './session';

/** Ganti isi array/objek yang di-export tanpa mengganti referensinya (layar mengimpor objek yang sama) */
function replace<T>(target: T[], items: T[]) {
  target.splice(0, target.length, ...items);
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const monthYear = (iso: string) => {
  const d = new Date(iso);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};
const rupiahShort = (n: number) =>
  n >= 1_000_000 ? `Rp${(n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} Jt` : `Rp${n.toLocaleString('id-ID')}`;

// ---------------------------------------------------------------------------
//  Bentuk data dari server (yang dipakai di sini saja)
// ---------------------------------------------------------------------------

type Me = {
  user: { fullName: string; nickname: string | null; email: string | null; phone: string | null; domicile: string | null; points: number; createdAt: string };
  teacherProfile: {
    title: string | null;
    headline: string | null;
    about: string | null;
    pricePerSession: number;
    availability: string | null;
    area: string | null;
    rating: number;
    reviewCount: number;
    sessionTarget: number;
    verificationStatus: string;
    specializations: { needOption: { label: string; category: string } }[];
    skills: { skill: string; level: number }[];
  } | null;
  psychologistProfile: {
    title: string;
    place: string | null;
    experienceYears: number;
    rating: number;
    reviewCount: number;
    categories: string[];
    tags: string[];
    basePrice: number;
  } | null;
  children: ServerChild[];
  plan: { plan: 'MONTHLY' | 'YEARLY' } | null;
  stats: { sessionsDone: number; points: number; joined: string };
};

type Checkin = { days: { day: string; reward: number; status: string }[]; todayDone: boolean };

type ServerNotification = {
  id: string;
  group: 'today' | 'yesterday' | 'week';
  time: string;
  category: 'chat' | 'booking' | 'laporan' | 'lainnya';
  icon: string | null;
  tone: Tone | null;
  title: string;
  body: string;
  tag: string | null;
  action: string | null;
  link: string | null;
  unread: boolean;
};

type Engagement = {
  id: string;
  status: string;
  teacher: { id: string; name: string };
  parent: { id: string; name: string };
  child: { id: string; name: string; fullName: string };
  chatId: string | null;
  tags: { label: string; tone: Tone }[];
  nextSession: string;
  done: number;
  total: number;
  phase: string;
};

const CATEGORY_TONE: Record<string, Tone> = { KOMUNIKASI: 'green', SOSIAL: 'red', AKADEMIK: 'yellow', SENSORIK: 'blue', PERILAKU: 'gray' };
const SKILL_KEY: Record<string, Skill> = {
  SPEECH: 'speech',
  COMMUNICATION: 'communication',
  ADHD: 'adhd',
  SENSORY: 'sensory',
  SOCIAL: 'social',
  AUTISM: 'autism',
  ACADEMIC: 'academic',
};

function notificationFor(n: ServerNotification): NotificationItem {
  return {
    id: n.id,
    group: n.group,
    category: n.category,
    icon: n.icon ?? 'bell',
    tone: n.tone ?? 'blue',
    title: n.title,
    time: n.time,
    body: n.body,
    unread: n.unread,
    tag: n.tag ?? '',
    tagTone: n.tone ?? 'blue',
    action: n.action ?? undefined,
    actionPrimary: Boolean(n.action),
    link: n.link ?? undefined,
  };
}

// tautan dari backend → rute aplikasi per role
export function appLink(link: string | null | undefined, role: UserRole) {
  if (!link) return '/notifikasi';
  if (role === 'psychologist' && link.startsWith('/konsultasi/')) return `/psikolog${link}`;
  return link;
}

// ---------------------------------------------------------------------------
//  Per role
// ---------------------------------------------------------------------------

async function loadParent() {
  const [me, home, engagements, apps, notif, psys] = await Promise.all([
    api<Me>('/auth/me'),
    api<{
      quickQuestion: { id: string; from: string; text: string } | null;
      activeTeachers: { engagementId: string; teacherId: string; name: string; next: string }[];
      checkin: Checkin;
    }>('/home/parent'),
    api<Engagement[]>('/engagements'),
    api<{ id: string; status: string; date: string; child: { name: string }; teacher: { name: string; specialty: string | null } }[]>('/applications'),
    api<{ items: ServerNotification[] }>('/notifications'),
    api<(Psychologist & { finalPrice: number; badge: string | null })[]>('/psychologists'),
  ]);

  Object.assign(parentProfile, {
    name: me.user.nickname ?? me.user.fullName.split(' ')[0],
    fullName: me.user.fullName,
    email: me.user.email ?? '-',
    phone: me.user.phone ?? '-',
    domicile: me.user.domicile ?? '-',
    joined: monthYear(me.stats.joined),
    sessionsDone: me.stats.sessionsDone,
  });
  setChildren(me.children.map(toChild));
  setPlans({ parent: me.plan ? (me.plan.plan === 'YEARLY' ? 'tahunan' : 'bulanan') : null });
  setServerPoints('parent', me.user.points);
  setCheckinWeek('parent', home.checkin, me.children[0]?.id ?? null);

  Object.assign(quickQuestion, home.quickQuestion ?? { from: '', text: '' }, { id: home.quickQuestion?.id ?? '' });
  const active = engagements.filter((e) => e.status === 'ACTIVE');
  replace(
    activeTeachers,
    active.map((e) => ({ id: e.chatId ?? e.teacher.id, name: e.teacher.name.split(',')[0], next: e.nextSession }))
  );
  replace(
    activeMatches,
    active.map(
      (e): ActiveMatch => ({
        id: e.id,
        teacher: e.teacher.name,
        chatId: e.chatId ?? '',
        online: false,
        child: e.child.name,
        tags: e.tags,
        nextSession: e.nextSession,
        done: e.done,
        total: e.total,
        phase: e.phase,
      })
    )
  );
  replace(
    applications,
    apps.map((a) => ({
      id: a.id,
      teacher: a.teacher.name,
      specialty: a.teacher.specialty ?? 'Shadow Teacher',
      child: a.child.name,
      date: a.date,
      status: a.status === 'ACCEPTED' ? 'accepted' : a.status === 'PENDING' ? 'pending' : 'rejected',
    }))
  );
  replace(notifications, notif.items.map(notificationFor));
  replace(
    psychologists,
    psys.map((p) => ({
      ...p,
      badge: p.badge ?? 'Psikolog Mitra',
      badgeTone: (p.badge?.includes('Top') ? 'yellow' : p.badge?.includes('Online') ? 'green' : 'blue') as Tone,
      badgeIcon: p.badge?.includes('Online') ? ('circle' as const) : ('star' as const),
      categories: p.categories as Psychologist['categories'],
    }))
  );

  // report card anak pertama (layar Jadwal / Report Card memuat ulang per anak)
  const first = me.children[0];
  replace(sessionReports, first ? await api<SessionReport[]>(`/children/${first.id}/reports`).catch(() => []) : []);
}

async function loadTeacher() {
  const [me, home, engagements, notif, apps] = await Promise.all([
    api<Me>('/auth/me'),
    api<{
      todaySchedule: { time: string; childName: string }[];
      earnings: { month: number; weekGrowthPercent: number };
      sessions: { doneThisMonth: number; target: number };
      checkin: Checkin;
      selectedChildId: string | null;
    }>('/home/teacher'),
    api<Engagement[]>('/engagements'),
    api<{ items: ServerNotification[] }>('/notifications'),
    api<{ id: string; status: string; date: string; child: { name: string; age: number | null; grade: string | null; condition: string } }[]>('/applications'),
  ]);
  const t = me.teacherProfile;
  const skills = Object.fromEntries(Object.values(SKILL_KEY).map((k) => [k, 0])) as Record<Skill, number>;
  t?.skills.forEach((s) => (skills[SKILL_KEY[s.skill]] = s.level));
  const name = t?.title ? `${me.user.fullName}, ${t.title}` : me.user.fullName;
  Object.assign(teacherProfile, {
    name,
    shortName: me.user.nickname ?? me.user.fullName.split(' ')[0],
    title: t?.headline ?? 'Shadow Teacher',
    city: (me.user.domicile ?? '-').split(',').pop()?.trim() ?? '-',
    rating: t?.rating ?? 0,
    reviewCount: t?.reviewCount ?? 0,
    sessionsDone: me.stats.sessionsDone,
    joined: monthYear(me.stats.joined),
    about: t?.about ?? '',
    specializations: (t?.specializations ?? []).map((s) => ({ label: s.needOption.label, tone: CATEGORY_TONE[s.needOption.category] ?? 'gray' })),
    price: `Rp${(t?.pricePerSession ?? 0).toLocaleString('id-ID')}/jam`,
    availability: t?.availability ?? '-',
    skills,
    earnings: {
      total: rupiahShort(home.earnings.month),
      growth: `${home.earnings.weekGrowthPercent >= 0 ? '+' : ''}${home.earnings.weekGrowthPercent}% minggu ini`,
    },
    target: { done: home.sessions.doneThisMonth, total: home.sessions.target },
  });
  updateSession({ name });
  setPlans({ teacher: me.plan ? (me.plan.plan === 'YEARLY' ? 'tahunan' : 'bulanan') : null });
  setServerPoints('teacher', me.user.points);
  setCheckinWeek('teacher', home.checkin, home.selectedChildId);

  const next = home.todaySchedule[0];
  Object.assign(todaySchedule, next ? { time: next.time, child: next.childName } : { time: '-', child: 'Belum ada sesi' });
  replace(
    students,
    engagements
      .filter((e) => e.status === 'ACTIVE')
      .map(
        (e): Student => ({
          id: e.child.id,
          name: e.child.name,
          fullName: e.child.fullName,
          grade: '-',
          condition: e.tags.map((x) => x.label).slice(0, 2).join(' & '),
          gender: 'female',
          age: 0,
          parent: e.parent.name,
          chatId: e.chatId ?? '',
          tags: e.tags,
          nextSession: e.nextSession,
          done: e.done,
          total: e.total,
          phase: e.phase,
        })
      )
  );
  const status = (s: string) => (s === 'ACCEPTED' ? 'accepted' : s === 'PENDING' ? 'pending' : 'rejected') as 'accepted' | 'pending' | 'rejected';
  replace(
    activeApplications,
    apps.slice(0, 5).map((a) => ({
      id: a.id,
      initials: a.child.name,
      gender: 'female' as const,
      info: `${a.child.grade ?? '-'} - ${a.child.condition.toUpperCase()}`,
      status: status(a.status),
    }))
  );
  replace(
    teacherApplications,
    apps.map((a) => ({ id: a.id, initials: a.child.name, age: a.child.age ?? 0, gender: 'female' as const, date: a.date, status: status(a.status) }))
  );
  replace(
    teacherNotifications,
    notif.items.map(
      (n): TeacherNotification => ({
        id: n.id,
        group: n.group === 'today' ? 'today' : 'yesterday',
        category: n.category,
        icon: n.icon ?? 'bell',
        tone: n.tone ?? 'blue',
        title: n.title,
        time: n.time,
        body: n.body,
        action: n.action ?? undefined,
        href: appLink(n.link, 'teacher') as TeacherNotification['href'],
      })
    )
  );
}

async function loadPsychologist() {
  const [me, consults, notif, pending, balance] = await Promise.all([
    api<Me>('/auth/me'),
    api<
      {
        id: string;
        status: string;
        type: 'VIDEO' | 'CALL' | 'CHAT';
        scheduledAt: string;
        date: string;
        time: string;
        parent: { name: string };
        child: { name: string } | null;
        complaint: string | null;
        result: { observation: string | null; recommendation: string | null } | null;
      }[]
    >('/consultations'),
    api<{ items: ServerNotification[] }>('/notifications'),
    api<Applicant[]>('/psychologists/me/teacher-applicants'),
    api<{ totalEarned: number }>('/payouts/balance'),
  ]);
  const p = me.psychologistProfile;
  Object.assign(psychologistProfile, {
    name: me.user.fullName,
    shortName: me.user.nickname ?? me.user.fullName.split(' ')[0],
    title: p?.title ?? 'Psikolog',
    rating: p?.rating ?? 0,
    reviewCount: p?.reviewCount ?? 0,
    experienceYears: p?.experienceYears ?? 0,
    consultationsThisMonth: consults.filter((c) => new Date(c.scheduledAt).getMonth() === new Date().getMonth()).length,
    specializations: p?.categories.length ? p.categories : (p?.tags ?? []),
    rate: p?.basePrice ?? 0,
    earningsThisMonth: rupiahShort(balance.totalEarned),
    verificationsDone: pending.filter((a) => a.result).length,
  });
  const today = new Date().toDateString();
  replace(
    consultations,
    consults
      .filter((c) => c.status === 'CONFIRMED' || c.status === 'COMPLETED')
      .map(
        (c): Consultation => ({
          id: c.id,
          child: c.child?.name ?? 'Anak',
          gender: 'female',
          age: 0,
          parent: c.parent.name,
          needs: [],
          complaint: c.complaint ?? '-',
          day: c.date,
          today: new Date(c.scheduledAt).toDateString() === today,
          time: c.time,
          mode: c.type === 'VIDEO' ? 'video' : c.type === 'CALL' ? 'voice' : 'onsite',
          report: c.result?.observation ? { note: c.result.observation, recommendations: c.result.recommendation ? [c.result.recommendation] : [] } : undefined,
        })
      )
  );
  replace(applicants, pending);
  replace(
    psychologistNotifications,
    notif.items.map(
      (n): PsychologistNotification => ({
        id: n.id,
        group: n.group === 'week' ? 'earlier' : n.group,
        category: n.category === 'booking' ? 'booking' : n.category === 'chat' ? 'chat' : 'pembayaran',
        icon: n.icon ?? 'bell',
        tone: n.tone ?? 'blue',
        title: n.title,
        time: n.time,
        body: n.body,
        action: n.action ?? undefined,
        href: appLink(n.link, 'psychologist') as PsychologistNotification['href'],
      })
    )
  );
}

// harga paket Plus diatur admin (konten "plans")
async function loadPlusPlans() {
  const { value } = await api<{ value: { role: PlusRole; key: 'bulanan' | 'tahunan'; price: number; note: string; badge: string | null }[] }>('/content/plans');
  for (const p of value) {
    const plan = plusPlans[p.role]?.find((x) => x.key === p.key);
    if (plan) Object.assign(plan, { price: p.price, note: p.note, badge: p.badge ?? undefined });
  }
}

// topik cepat Doobie diatur admin (konten "doobieTopics")
async function loadDoobieTopics() {
  const { value } = await api<{ value: { id: string; role: PlusRole; label: string; question: string; answer: string[]; order: number }[] }>(
    '/content/doobieTopics'
  );
  for (const role of ['parent', 'teacher'] as PlusRole[]) {
    replace(
      doobieTopics[role],
      value.filter((t) => t.role === role).sort((a, b) => a.order - b.order).map(({ id, label, question, answer }) => ({ id, label, question, answer }))
    );
  }
}

/** Syarat & Ketentuan / Kebijakan Privasi versi terbaru dari web admin (bisa dibuka sebelum login) */
export async function loadLegal() {
  for (const type of ['terms', 'privacy'] as const) {
    const row = await api<{ updatedAt: string | null; value: { title: string; sections: { h: string; p: string }[] } }>(`/content/legal.${type}`);
    Object.assign(legalDocs[type], {
      title: row.value.title,
      sections: row.value.sections,
      ...(row.updatedAt ? { updated: `Terakhir diperbarui ${new Date(row.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` } : {}),
    });
  }
}

/** Dipanggil setelah login & saat aplikasi dibuka dengan sesi tersimpan */
export async function loadAppData(role: UserRole) {
  resetAppData();
  await Promise.all([
    role === 'parent' ? loadParent() : role === 'teacher' ? loadTeacher() : loadPsychologist(),
    loadThreads(),
    loadCommunity(),
    // konten dari web admin; kalau gagal, isi bawaan aplikasi tetap dipakai
    loadPlusPlans().catch(() => {}),
    loadDoobieTopics().catch(() => {}),
  ]);
}

/** Kosongkan data contoh bawaan & data akun sebelumnya (logout / ganti akun) */
export function resetAppData() {
  for (const list of [
    activeMatches,
    activeTeachers,
    applications,
    chatThreads,
    notifications,
    psychologists,
    sessionReports,
    teacherPool,
    connectedTeachers,
    students,
    activeApplications,
    teacherApplications,
    teacherChatThreads,
    seekingChildren,
    teacherNotifications,
    consultations,
    applicants,
    psychologistChatThreads,
    psychologistNotifications,
  ] as unknown[][]) {
    list.length = 0;
  }
  for (const map of [serverMatch, serverChildMatch] as Record<string, unknown>[]) {
    for (const key of Object.keys(map)) delete map[key];
  }
  setChildren([]);
  resetChats();
  resetMatching();
  resetChildMatching();
  resetCommunity();
  setPlans({ parent: null, teacher: null });
}
