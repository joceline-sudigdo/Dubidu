import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import { topSkills, SKILL_LABELS, type Teacher } from '@/data/teachers';

import type { FeedPost } from './community-store';

// tautan langsung ke halaman di aplikasi DUBIDU (dubidu://... di APK, exp://... di Expo Go)
const appUrl = (path: string) => Linking.createURL(path);

/** Bagikan profil shadow teacher: kalimat pembuka + tautan yang membuka profilnya di aplikasi */
export function shareTeacher(teacher: Teacher) {
  const name = teacher.name.split(',')[0];
  const skills = topSkills(teacher, 2)
    .map((k) => SKILL_LABELS[k])
    .join(' & ');
  const url = appUrl(`/profil-teacher/${teacher.id}`);
  const message =
    `Hai! 💙 Aku menemukan shadow teacher yang mungkin cocok untuk si kecil: ${name}` +
    (skills ? `, berpengalaman di ${skills}` : '') +
    `.\n\nYuk lihat profil lengkapnya di aplikasi DUBIDU:\n${url}\n\n` +
    'DUBIDU, teman perjalanan setiap anak menuju kemandirian.';
  return Share.share({ message, url });
}

/** Bagikan postingan komunitas: kutipan singkat + tautan yang membuka postingannya di aplikasi */
export function sharePost(post: FeedPost) {
  const quote = post.text.length > 140 ? `${post.text.slice(0, 137).trimEnd()}…` : post.text;
  const url = appUrl(`/postingan/${post.id}`);
  const message =
    `Ada cerita hangat dari Komunitas DUBIDU yang ingin aku bagikan 🌱\n\n` +
    (quote ? `"${quote}"\n— ${post.author}\n\n` : `Postingan dari ${post.author}\n\n`) +
    `Baca selengkapnya dan ikut berbagi di aplikasi DUBIDU:\n${url}`;
  return Share.share({ message, url });
}
