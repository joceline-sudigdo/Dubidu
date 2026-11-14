import { StyleSheet, View } from 'react-native';

import { Pill } from './pill';
import type { Tone } from './tones';

const DEFAULT_TONES: Tone[] = ['green', 'blue', 'red', 'yellow'];

type Tag = string | { label: string; tone: Tone };

// badge kebutuhan 1 baris: tampil 2 badge, sisanya jadi "+N".
// stacked = badge ditumpuk ke bawah (dipakai di kartu yang sempit seperti Riwayat)
export function TagRow({ tags, solid, max = 2, stacked }: { tags: Tag[]; solid?: boolean; max?: number; stacked?: boolean }) {
  const items = tags.map((t, i) => (typeof t === 'string' ? { label: t, tone: DEFAULT_TONES[i % DEFAULT_TONES.length] } : t));
  const visible = items.slice(0, max);
  const rest = items.length - visible.length;

  if (stacked) {
    return (
      <View style={styles.stack}>
        {items.map((t) => (
          <Pill key={t.label} label={t.label} tone={t.tone} solid={solid} size="md" style={styles.stackPill} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {visible.map((t) => (
        <Pill inRow key={t.label} label={t.label} tone={t.tone} solid={solid} size="md" style={styles.pill} />
      ))}
      {rest > 0 && <Pill inRow label={`+${rest}`} tone="gray" size="md" style={styles.more} />}
    </View>
  );
}

const styles = StyleSheet.create({
  // tidak boleh lebih lebar dari wadahnya (wadah di kartu sering row + wrap)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    maxWidth: '100%',
    flexShrink: 1,
  },
  // badge boleh mengecil (teks terpotong ...) supaya tetap 1 baris
  pill: {
    flexShrink: 1,
    paddingHorizontal: 12,
  },
  stack: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    gap: 6,
  },
  // lebar badge mengikuti teks, paling lebar selebar kolom (teks kepanjangan jadi ...)
  stackPill: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  more: {
    flexShrink: 0,
    paddingHorizontal: 10,
  },
});
