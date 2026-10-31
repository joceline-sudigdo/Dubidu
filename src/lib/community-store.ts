import { useSyncExternalStore } from 'react';

import { communityPhotos } from '@/data/images';
import { communityPosts, type CommunityPost } from '@/data/parent';

import { getSession } from './session';

export type PostRole = CommunityPost['role'];
export type PhotoSource = string | number | null; // uri foto user, require() dari images.ts, atau null = placeholder

export type FeedPost = Omit<CommunityPost, 'photos'> & { photos: PhotoSource[]; mine?: boolean };

export type PostComment = { id: string; author: string; role: PostRole; text: string; time: string; mine?: boolean };

const ROLE_LABEL = { parent: 'Orang Tua', teacher: 'Shadow Teacher', psychologist: 'Psikolog' } as const;

// beberapa contoh komentar yang ditampilkan di detail postingan
const SEED_COMMENTS: Record<string, PostComment[]> = {
  p0: [
    { id: 'c1', author: 'Bunda Arka', role: 'Orang Tua', text: 'Terima kasih tipsnya Bu, langsung saya coba minggu ini 🙏', time: '45 mnt lalu' },
    { id: 'c2', author: 'Pras Karunia, S.Pd', role: 'Shadow Teacher', text: 'Setuju! Pojok tenang sangat membantu murid saya juga.', time: '30 mnt lalu' },
  ],
  'p-teacher': [
    { id: 'c3', author: 'Bunda Sarah', role: 'Orang Tua', text: 'Makasih Kak Pras, Elisya cerita senang banget hari ini 🥰', time: '3 jam lalu' },
  ],
  p1: [
    { id: 'c4', author: 'Mama Dimas', role: 'Orang Tua', text: 'Ikut terharu bacanya Bun, semangat terus!', time: '2 mnt lalu' },
    { id: 'c5', author: 'Amanda Putri, M.Psi.', role: 'Psikolog', text: 'Sounding visual memang efektif. Konsistensi Bunda luar biasa 👏', time: '1 mnt lalu' },
  ],
  p2: [{ id: 'c6', author: 'Bunda Kirana', role: 'Orang Tua', text: 'Masyaallah, ikut bahagia Ma!', time: '1 jam lalu' }],
  p3: [{ id: 'c7', author: 'Nielsen Dave, S.Pd', role: 'Shadow Teacher', text: 'Coba timer visual 10 menit + jeda gerak 2 menit, Bun.', time: '4 jam lalu' }],
};

// sisa komentar dibuat otomatis dari kumpulan contoh supaya jumlahnya sesuai data
const COMMENT_POOL: Omit<PostComment, 'id' | 'time'>[] = [
  { author: 'Bunda Kirana', role: 'Orang Tua', text: 'Makasih sudah berbagi, jadi semangat lagi 💙' },
  { author: 'Mama Fitri', role: 'Orang Tua', text: 'Anak saya juga mirip, nanti saya coba ya.' },
  { author: 'Larasati Sudigdo, S.Psi', role: 'Shadow Teacher', text: 'Konsisten itu kuncinya, semangat Bun!' },
  { author: 'Bunda Lia', role: 'Orang Tua', text: 'Ikut senang bacanya 🥹' },
  { author: 'Dimas Wicaksono, S.Psi.', role: 'Psikolog', text: 'Langkah yang tepat. Kalau butuh asesmen lanjutan boleh konsultasi.' },
  { author: 'Papi Alvin', role: 'Orang Tua', text: 'Setuju, pelan-pelan tapi pasti.' },
  { author: 'Nadia Putri, S.Psi', role: 'Shadow Teacher', text: 'Bisa juga dibantu jadwal bergambar supaya lebih terprediksi.' },
  { author: 'Mami Larasati', role: 'Orang Tua', text: 'Terima kasih tipsnya, sangat membantu!' },
];
const TIMES = ['5 jam lalu', '4 jam lalu', '3 jam lalu', '2 jam lalu', '1 jam lalu', '40 mnt lalu', '20 mnt lalu', '10 mnt lalu'];

function seedComments(post: CommunityPost): PostComment[] {
  const base = SEED_COMMENTS[post.id] ?? [];
  const extra = Array.from({ length: Math.max(0, post.comments - base.length) }, (_, i) => ({
    ...COMMENT_POOL[(i + post.id.length) % COMMENT_POOL.length],
    id: `${post.id}-auto-${i}`,
    time: TIMES[i % TIMES.length],
  }));
  return [...extra, ...base];
}

type State = {
  posts: FeedPost[];
  liked: string[];
  hidden: string[];
  comments: Record<string, PostComment[]>;
};

let state: State = {
  posts: communityPosts.map((p) => ({
    ...p,
    photos: Array.from({ length: p.photos }, (_, i) => communityPhotos[p.id]?.[i] ?? null),
  })),
  liked: [],
  hidden: [],
  comments: Object.fromEntries(communityPosts.map((p) => [p.id, seedComments(p)])),
};
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function useCommunity() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
}

export function likeCount(s: State, post: FeedPost) {
  return post.likes + (s.liked.includes(post.id) ? 1 : 0);
}

// jumlah komentar = semua komentar yang benar-benar ada di postingan
export function commentCount(s: State, post: FeedPost) {
  return s.comments[post.id]?.length ?? 0;
}

export function formatCount(n: number) {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace('.0', '').replace('.', ',')}rb`;
}

export function toggleLike(id: string) {
  set({ ...state, liked: state.liked.includes(id) ? state.liked.filter((x) => x !== id) : [...state.liked, id] });
}

export function addPost(text: string, photos: string[], topic: CommunityPost['topic']) {
  const me = getSession();
  const post: FeedPost = {
    id: `mine-${Date.now()}`,
    author: me.name,
    role: ROLE_LABEL[me.role],
    time: 'Baru saja',
    text,
    photos,
    likes: 0,
    comments: 0,
    topic,
    mine: true,
  };
  set({ ...state, posts: [post, ...state.posts] });
}

export function deletePost(id: string) {
  set({ ...state, posts: state.posts.filter((p) => p.id !== id) });
}

export function hidePost(id: string) {
  set({ ...state, hidden: [...state.hidden, id] });
}

export function addComment(postId: string, text: string) {
  const me = getSession();
  const comment: PostComment = {
    id: `cm-${Date.now()}`,
    author: me.name,
    role: ROLE_LABEL[me.role],
    text,
    time: 'Baru saja',
    mine: true,
  };
  set({
    ...state,
    comments: { ...state.comments, [postId]: [...(state.comments[postId] ?? []), comment] },
  });
}

export function deleteComment(postId: string, commentId: string) {
  set({
    ...state,
    comments: { ...state.comments, [postId]: (state.comments[postId] ?? []).filter((c) => c.id !== commentId) },
  });
}
