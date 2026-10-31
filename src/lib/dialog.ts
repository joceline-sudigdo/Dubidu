import type Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import type { KeyboardTypeOptions } from 'react-native';
import { useSyncExternalStore } from 'react';

type FeatherName = ComponentProps<typeof Feather>['name'];

export type DialogButton = { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };

export type DialogState =
  | { kind: 'alert'; variant: 'info' | 'success' | 'confirm' | 'soon'; title: string; message?: string; buttons: DialogButton[] }
  | {
      kind: 'sheet';
      title?: string;
      options: { label: string; icon: FeatherName; destructive?: boolean; onPress: () => void }[];
    }
  | {
      kind: 'prompt';
      title: string;
      message?: string;
      value: string;
      placeholder?: string;
      multiline?: boolean;
      keyboardType?: KeyboardTypeOptions;
      submitText?: string;
      onSubmit: (value: string) => void;
    };

// popup bergaya Dubidu, pengganti Alert bawaan sistem
let current: DialogState | null = null;
const listeners = new Set<() => void>();

function set(next: DialogState | null) {
  current = next;
  listeners.forEach((l) => l());
}

export function useDialog() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current
  );
}

export function closeDialog() {
  set(null);
}

const SOON_MESSAGE = 'Fitur ini akan segera tersedia.';
const SUCCESS_WORDS = ['terkirim', 'berhasil', 'yeay', 'dibuat', 'tersimpan', 'diajukan'];

// signature sama dengan Alert.alert biar gampang dipakai
export function showAlert(title: string, message?: string, buttons?: DialogButton[]) {
  const lower = title.toLowerCase();
  const variant =
    message === SOON_MESSAGE
      ? 'soon'
      : buttons && buttons.length > 1
        ? 'confirm'
        : SUCCESS_WORDS.some((w) => lower.includes(w))
          ? 'success'
          : 'info';
  set({
    kind: 'alert',
    variant,
    title,
    message: variant === 'soon' ? `Fitur ${title.toLowerCase()} sedang kami siapkan. Tunggu kabar baiknya ya!` : message,
    buttons: buttons?.length ? buttons : [{ text: variant === 'soon' ? 'Oke, mengerti' : 'OK' }],
  });
}

export function comingSoon(feature: string) {
  showAlert(feature, SOON_MESSAGE);
}

export function showActionSheet(sheet: Omit<Extract<DialogState, { kind: 'sheet' }>, 'kind'>) {
  set({ kind: 'sheet', ...sheet });
}

export function showPrompt(prompt: Omit<Extract<DialogState, { kind: 'prompt' }>, 'kind'>) {
  set({ kind: 'prompt', ...prompt });
}
