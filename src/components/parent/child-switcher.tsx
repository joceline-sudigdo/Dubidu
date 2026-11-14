import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import type { Gender } from '@/data/teacher';
import { useChildren } from '@/lib/children-store';

import { Avatar } from './avatar';
import { BearAvatar } from './bear-avatar';
import { Pill } from './pill';

type SwitcherItem = { id: string; name: string; fullName: string; grade: string; condition: string; gender?: Gender };

export function ChildSwitcher<T extends SwitcherItem>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (child: T) => void;
  items?: T[];
}) {
  const [open, setOpen] = useState(false);
  const all = useChildren() as unknown as T[];
  const list = items ?? all;

  return (
    <View style={[styles.card, Shadow.clay]}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.row}>
        {value.gender ? (
          <BearAvatar gender={value.gender} size={52} />
        ) : (
          <Avatar name={value.fullName} size={52} ring="#FFFFFF" />
        )}
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <AppText style={styles.name}>{value.name}</AppText>
            <Pill inRow label={value.grade} tone="blue" />
            <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.primary} />
          </View>
          <AppText variant="caption" color={Colors.primary}>
            {value.condition}
          </AppText>
        </View>
      </Pressable>
      {open &&
        list
          .filter((c) => c.id !== value.id)
          .map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                onChange(c);
                setOpen(false);
              }}
              style={[styles.row, styles.option]}>
              {c.gender ? <BearAvatar gender={c.gender} size={36} /> : <Avatar name={c.fullName} size={36} />}
              <View style={styles.flex}>
                <AppText style={styles.optionName}>{c.name}</AppText>
                <AppText variant="caption">{c.condition}</AppText>
              </View>
            </Pressable>
          ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: Colors.blueMid,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 20,
  },
  option: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.blueMid,
  },
  optionName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
});
