import { useSyncExternalStore } from 'react';

import type { CommunityPost } from '@/data/parent';

import { api, errorMessage, uploadFile } from './api';
import { showAlert } from './dialog';
import { getSession } from './session';

export type PostRole = CommunityPost['role'];
export type PhotoSource = string | number | null; // uri foto user, require() dari images.ts, atau null = placeholder

export type FeedPost = Omit<CommunityPost, 'photos'> & { photos: PhotoSource[]; mine?: boolean };

export type PostComment = { id: string; author: string; role: PostRole; text: string; time: string; mine?: boolean };

const ROLE_LABEL = { parent: 'Orang Tua', teacher: 'Shadow Teacher', psychologist: 'Psikolog' } as const;

type State = {
  posts: FeedPost[];
  liked: string[];
  hidden: string[];
  saved: string[];
  comments: Record<string, PostComment[]>;
};

const EMPTY: State = { posts: [], liked: [], hidden: [], saved: [], comments: {} };
let state: State = EMPTY;
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

// jumlah komentar: dari daftar komentar kalau sudah dimuat, kalau belum dari angka di server
export function commentCount(s: State, post: FeedPost) {
  return s.comments[post.id]?.length ?? post.comments;
}

export function formatCount(n: number) {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace('.0', '').replace('.', ',')}rb`;
}

// ---------------------------------------------------------------------------
//  Sinkron dengan server (/api/posts)
// ---------------------------------------------------------------------------

type ServerPost = {
  id: string;
  author: string;
  authorRole: PostRole;
  isMine: boolean;
  time: string;
  text: string;
  photos: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  topic: CommunityPost['topic'];
};

type ServerComment = { id: string; author: string; authorRole: PostRole; isMine: boolean; text: string; time: string };

const toPost = (p: ServerPost): FeedPost => ({
  id: p.id,
  author: p.author,
  role: p.authorRole,
  time: p.time.replace('Diposting ', ''),
  text: p.text,
  photos: p.photos,
  // likes = suka dari orang lain; suka milikku dihitung dari daftar `liked`
  likes: p.likeCount - (p.likedByMe ? 1 : 0),
  comments: p.commentCount,
  topic: p.topic,
  mine: p.isMine,
});

export async function loadCommunity() {
  const { posts } = await api<{ posts: ServerPost[] }>('/posts');
  set({ ...state, posts: posts.map(toPost), liked: posts.filter((p) => p.likedByMe).map((p) => p.id) });
}

export async function loadComments(postId: string) {
  const rows = await api<ServerComment[]>(`/posts/${postId}/comments`);
  set({
    ...state,
    comments: {
      ...state.comments,
      [postId]: rows.map((c) => ({ id: c.id, author: c.author, role: c.authorRole, text: c.text, time: c.time, mine: c.isMine })),
    },
  });
}

export function resetCommunity() {
  set(EMPTY);
}

const fail = (title: string) => (e: unknown) => showAlert(title, errorMessage(e));

export function toggleLike(id: string) {
  const wasLiked = state.liked.includes(id);
  set({ ...state, liked: wasLiked ? state.liked.filter((x) => x !== id) : [...state.liked, id] });
  api(`/posts/${id}/like`, { body: {} }).catch((e) => {
    set({ ...state, liked: wasLiked ? [...state.liked, id] : state.liked.filter((x) => x !== id) });
    fail('Gagal menyukai postingan')(e);
  });
}

export async function addPost(text: string, photos: string[], topic: CommunityPost['topic']) {
  const me = getSession();
  try {
    const urls = await Promise.all(photos.map((uri) => uploadFile(uri, 'komunitas')));
    const saved = await api<{ id: string }>('/posts', { body: { text, topic, photos: urls } });
    const post: FeedPost = { id: saved.id, author: me.nickname || me.name, role: ROLE_LABEL[me.role], time: 'Baru saja', text, photos: urls, likes: 0, comments: 0, topic, mine: true };
    set({ ...state, posts: [post, ...state.posts] });
    return true;
  } catch (e) {
    fail('Postingan belum terkirim')(e);
    return false;
  }
}

export function deletePost(id: string) {
  const before = state.posts;
  set({ ...state, posts: state.posts.filter((p) => p.id !== id) });
  api(`/posts/${id}`, { method: 'DELETE' }).catch((e) => {
    set({ ...state, posts: before });
    fail('Gagal menghapus postingan')(e);
  });
}

// simpan / batal simpan postingan (dilihat lagi di Profil > Postingan Tersimpan)
export function toggleSave(id: string) {
  const saved = state.saved.includes(id) ? state.saved.filter((x) => x !== id) : [id, ...state.saved];
  set({ ...state, saved });
  return saved.includes(id);
}

export function hidePost(id: string) {
  set({ ...state, hidden: [...state.hidden, id] });
}

/** Tombol "Laporkan": masuk antrian moderasi web admin */
export async function reportContent(targetType: 'POST' | 'COMMENT' | 'USER' | 'CONVERSATION', targetId: string, reason: string, detail?: string) {
  try {
    await api('/content-reports', { body: { targetType, targetId, reason, detail } });
    return true;
  } catch (e) {
    fail('Laporan belum terkirim')(e);
    return false;
  }
}

export function addComment(postId: string, text: string) {
  const me = getSession();
  const temp: PostComment = { id: `tmp-${Date.now()}`, author: me.nickname || me.name, role: ROLE_LABEL[me.role], text, time: 'Baru saja', mine: true };
  set({ ...state, comments: { ...state.comments, [postId]: [...(state.comments[postId] ?? []), temp] } });
  api<{ id: string }>(`/posts/${postId}/comments`, { body: { text } })
    .then((saved) =>
      set({
        ...state,
        comments: { ...state.comments, [postId]: (state.comments[postId] ?? []).map((c) => (c.id === temp.id ? { ...c, id: saved.id } : c)) },
      })
    )
    .catch((e) => {
      set({ ...state, comments: { ...state.comments, [postId]: (state.comments[postId] ?? []).filter((c) => c.id !== temp.id) } });
      fail('Komentar belum terkirim')(e);
    });
}

// komentar hanya disembunyikan di HP ini (server belum punya hapus komentar)
export function deleteComment(postId: string, commentId: string) {
  set({
    ...state,
    comments: { ...state.comments, [postId]: (state.comments[postId] ?? []).filter((c) => c.id !== commentId) },
  });
}
