// kategori kebutuhan anak, dipakai di registrasi anak & spesialisasi shadow teacher
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import { Colors } from '@/constants/theme';

export const NEED_CATEGORIES: {
  title: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  options: string[];
}[] = [
  {
    title: 'Komunikasi',
    icon: 'account-voice',
    color: Colors.green,
    options: ['Speech delay', 'Sulit menyampaikan kebutuhan', 'Kesulitan memahami instruksi'],
  },
  {
    title: 'Sosial',
    icon: 'account-group',
    color: Colors.red,
    options: ['Sulit berinteraksi dengan teman', 'Kurang kontak mata', 'Sulit bergiliran & berbagi'],
  },
  {
    title: 'Akademik',
    icon: 'book-open-variant',
    color: Colors.yellow,
    options: ['Sulit fokus & konsentrasi', 'Kesulitan membaca & menulis', 'Kesulitan berhitung'],
  },
  {
    title: 'Sensorik',
    icon: 'ear-hearing',
    color: Colors.primary,
    options: ['Sensitif terhadap suara', 'Sensitif terhadap sentuhan', 'Mencari stimulasi berlebih'],
  },
];
