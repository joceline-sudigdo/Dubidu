import { StyleSheet, View } from 'react-native';

import { Pill } from './pill';
import type { Tone } from './tones';

const DEFAULT_TONES: Tone[] = ['green', 'blue', 'red', 'yellow'];

type Tag = string | { label: string; tone: Tone };

// badge kebutuhan selalu 1 baris: tampil 2 badge, sisanya jadi "+N"
export function TagRow({ tags, solid, max = 2 }: { tags: Tag[]; solid?: boolean; max?: number }) {
  const items = tags.map((t, i) => (typeof t === 'string' ? { label: t, tone: DEFAULT_TONES[i % DEFAULT_TONES.length] } : t));
  const visible = items.slice(0, max);
  const rest = items.length - visible.length;

  return (
    <View style={styles.row}>
      {visible.map((t) => (
        <Pill key={t.label} label={t.label} tone={t.tone} solid={solid} size="md" style={styles.pill} />
      ))}
      {rest > 0 && <Pill label={`+${rest}`} tone="gray" size="md" style={styles.more} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  // badge boleh mengecil (teks terpotong ...) supaya tetap 1 baris
  pill: {
    flexShrink: 1,
    paddingHorizontal: 12,
  },
  more: {
    flexShrink: 0,
    paddingHorizontal: 10,
  },
});
