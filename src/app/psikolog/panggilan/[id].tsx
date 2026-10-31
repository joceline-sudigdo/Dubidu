import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/parent/avatar';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { consultations, psychologistProfile } from '@/data/psychologist';
import { finishSession } from '@/lib/psikolog-store';

function formatDuration(total: number) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// layar panggilan konsultasi; video belum tersambung kamera sungguhan, jadi pakai foto profil
export default function PanggilanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = consultations.find((x) => x.id === id) ?? consultations[0];
  const video = c.mode === 'video';
  const [seconds, setSeconds] = useState(0);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(video);
  const [speaker, setSpeaker] = useState(true);
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const end = () => {
    finishSession(c.id);
    router.back();
  };

  const main = swapped ? psychologistProfile.name : c.parent;
  const tile = swapped ? c.parent : psychologistProfile.name;
  const tileCameraOff = !swapped && !camera;
  const fg = video ? '#FFFFFF' : Colors.text;

  return (
    <View style={styles.root}>
      <StatusBar style={video ? 'light' : 'dark'} />
      {video ? (
        <LinearGradient colors={[Colors.primaryDark, '#0F2C4D']} style={StyleSheet.absoluteFill}>
          <View style={styles.remote}>
            <Avatar name={main} size={200} ring="rgba(255,255,255,0.35)" />
          </View>
        </LinearGradient>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.blueSoft }]} />
      )}

      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <AppText style={[styles.name, { color: video ? '#FFFFFF' : Colors.primaryDark }]}>{c.parent}</AppText>
          <AppText style={[styles.timer, { color: video ? 'rgba(255,255,255,0.85)' : Colors.textSecondary }]}>
            {formatDuration(seconds)}
          </AppText>
          {!mic && (
            <View style={styles.muted}>
              <Feather name="mic-off" size={14} color="#FFFFFF" />
              <AppText style={styles.mutedText}>Mikrofon mati</AppText>
            </View>
          )}
        </View>

        {video ? (
          <Pressable
            accessibilityLabel="Tukar tampilan"
            onPress={() => setSwapped((s) => !s)}
            style={[styles.tile, Shadow.clay]}>
            {tileCameraOff ? (
              <View style={styles.tileOff}>
                <Feather name="video-off" size={26} color="#FFFFFF" />
              </View>
            ) : (
              <Avatar name={tile} size={88} />
            )}
          </Pressable>
        ) : (
          <View style={styles.voice}>
            <View style={[styles.voiceRing, Shadow.clay]}>
              <Avatar name={c.parent} size={200} ring="#FFFFFF" />
            </View>
            <AppText variant="body" color={Colors.textSecondary}>
              Konsultasi {c.child} · {c.time}
            </AppText>
          </View>
        )}

        <View style={styles.controls}>
          <Control
            icon={mic ? 'mic' : 'mic-off'}
            label="Mikrofon"
            active={mic}
            color={fg}
            onPress={() => setMic((m) => !m)}
          />
          <Control
            icon={camera ? 'video' : 'video-off'}
            label="Kamera"
            active={camera}
            color={fg}
            onPress={() => setCamera((v) => !v)}
          />
          {video ? (
            <Control icon="refresh-cw" label="Balik" active color={fg} onPress={() => setSwapped((s) => !s)} />
          ) : (
            <Control
              icon={speaker ? 'volume-2' : 'volume-x'}
              label="Speaker"
              active={speaker}
              color={fg}
              onPress={() => setSpeaker((s) => !s)}
            />
          )}
          <View style={styles.control}>
            <Pressable accessibilityLabel="Akhiri panggilan" onPress={end} style={[styles.end, Shadow.soft]}>
              <Feather name="phone-off" size={26} color="#FFFFFF" />
            </Pressable>
            <AppText style={[styles.controlLabel, { color: fg }]}>Akhiri</AppText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Control({
  icon,
  label,
  active,
  color,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.control}>
      <Pressable
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={[styles.button, !active && styles.buttonOff, Shadow.soft]}>
        <Feather name={icon} size={24} color={active ? Colors.text : '#FFFFFF'} />
      </Pressable>
      <AppText style={[styles.controlLabel, { color }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  remote: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    lineHeight: 42,
  },
  timer: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
  },
  muted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(201, 61, 53, 0.9)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  mutedText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  tile: {
    position: 'absolute',
    top: 130,
    right: 20,
    width: 110,
    height: 150,
    borderRadius: Radius.md,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileOff: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#123A66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  voiceRing: {
    borderRadius: 110,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  controls: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  control: {
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOff: {
    backgroundColor: 'rgba(107, 122, 144, 0.85)',
  },
  end: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
});
