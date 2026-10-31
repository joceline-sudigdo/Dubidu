import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { Gender } from '@/data/teacher';

const SOURCES = {
  female: require('@/assets/images/mascot/child-girl.png'),
  male: require('@/assets/images/mascot/child-boy.png'),
};

// foto anak diganti beruang: pink perempuan, biru laki-laki
export function BearAvatar({ gender, size = 52, online }: { gender: Gender; size?: number; online?: boolean }) {
  return (
    <View>
      <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={SOURCES[gender]} style={StyleSheet.absoluteFill} contentFit="cover" />
      </View>
      {online && (
        <View
          style={[
            styles.online,
            { width: size * 0.22, height: size * 0.22, borderRadius: size * 0.11 },
          ]}
        />
      )}
    </View>
  );
}

export const bearSource = (gender: Gender) => SOURCES[gender];

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  online: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
