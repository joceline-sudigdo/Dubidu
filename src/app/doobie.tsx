import Feather from '@expo/vector-icons/Feather';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { showAlert } from '@/lib/dialog';
import { askText, askTopic, clearDoobie, sendVoice, useDoobie, type DoobieMessage } from '@/lib/doobie-store';
import { getSession } from '@/lib/session';

const MASCOT = require('@/assets/images/mascot/wait.png');
// foto profil Doobie di header: dasi biru untuk teacher, pita pink untuk orang tua
const DOOBIE_AVATAR = {
  parent: require('@/assets/images/mascot/bear-girl.png'),
  teacher: require('@/assets/images/mascot/bear-boy.png'),
};
const WAVE = [6, 12, 18, 10, 22, 14, 8, 16, 20, 12, 7, 15, 19, 9, 13, 17, 8, 11];

const fmtDuration = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// chat dengan Doobie: pilih topik -> jawaban template, ketik bebas, atau kirim voice note
export default function DoobieScreen() {
  const params = useLocalSearchParams<{ topic?: string; q?: string; voice?: string }>();
  const { messages, typing, topics } = useDoobie();
  const [text, setText] = useState('');
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const handled = useRef(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        showAlert('Izin mikrofon dibutuhkan', 'Aktifkan izin mikrofon di pengaturan HP untuk mengirim voice note.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch {
      showAlert('Gagal merekam', 'Mikrofon sedang dipakai aplikasi lain. Coba lagi ya.');
    }
  };

  const stopRecording = async (send: boolean) => {
    const duration = recState.durationMillis;
    setRecording(false);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      // abaikan, rekaman mungkin sudah berhenti
    }
    if (send && recorder.uri && duration > 600) sendVoice(recorder.uri, duration);
    else if (send) showAlert('Voice note terlalu pendek', 'Tahan sedikit lebih lama ya.');
  };

  // pertanyaan dari kartu Doobie di beranda (topik / teks / mic) langsung dijalankan sekali
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const topic = topics.find((t) => t.id === params.topic);
    if (topic) askTopic(topic);
    else if (params.q) askText(params.q);
    // tunggu layar selesai terbuka dulu baru minta izin mikrofon
    else if (params.voice) setTimeout(startRecording, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = () => {
    askText(text);
    setText('');
  };

  const openMenu = () =>
    showAlert('Hapus percakapan?', 'Semua pesan dengan Doobie akan dihapus.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: clearDoobie },
    ]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <BackButton />
          <View style={styles.avatar}>
            <Image
              source={DOOBIE_AVATAR[getSession().role === 'teacher' ? 'teacher' : 'parent']}
              style={styles.avatarImg}
              contentFit="cover"
            />
          </View>
          <View style={styles.flex}>
            <AppText style={styles.name}>Doobie</AppText>
            <View style={styles.inline}>
              <View style={styles.statusDot} />
              <AppText variant="caption">{typing ? 'Sedang mengetik...' : 'Asisten Dubidu'}</AppText>
            </View>
          </View>
          <Pressable accessibilityLabel="Hapus percakapan" onPress={openMenu} style={styles.more}>
            <Feather name="trash-2" size={18} color={Colors.text} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled">
            <View style={styles.intro}>
              <Image source={MASCOT} style={styles.introImg} contentFit="contain" />
              <AppText style={styles.introTitle}>Halo, aku Doobie! 🐻</AppText>
              <AppText variant="caption" style={styles.center}>
                Pilih topik di bawah, ketik pertanyaan, atau kirim voice note. Doobie siap bantu!
              </AppText>
            </View>
            {messages.map((m) => (
              <Animated.View
                key={m.id}
                entering={FadeInDown.duration(250)}
                style={[styles.bubbleWrap, m.from === 'me' && styles.alignEnd]}>
                {m.type === 'voice' ? <VoiceBubble message={m} /> : <TextBubble message={m} />}
              </Animated.View>
            ))}
            {typing && <TypingBubble />}
          </ScrollView>

          {/* pilihan topik selalu tersedia di atas kolom input */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.topicBar}
            contentContainerStyle={styles.topics}>
            {topics.map((t) => (
              <Pressable
                key={t.id}
                disabled={typing}
                onPress={() => askTopic(t)}
                style={[styles.topic, typing && { opacity: 0.5 }]}>
                <AppText style={styles.topicText}>{t.label}</AppText>
              </Pressable>
            ))}
          </ScrollView>

          {recording ? (
            <Animated.View entering={FadeIn.duration(150)} style={styles.inputBar}>
              <Pressable accessibilityLabel="Batalkan rekaman" onPress={() => stopRecording(false)} style={styles.cancelRec}>
                <Feather name="trash-2" size={20} color={Colors.red} />
              </Pressable>
              <View style={styles.recWrap}>
                <PulseDot />
                <AppText style={styles.recTime}>{fmtDuration(recState.durationMillis)}</AppText>
                <AppText variant="caption" style={styles.flex} numberOfLines={1}>
                  Merekam voice note...
                </AppText>
              </View>
              <Pressable accessibilityLabel="Kirim voice note" onPress={() => stopRecording(true)} style={styles.send}>
                <Feather name="send" size={20} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          ) : (
            <View style={styles.inputBar}>
              <View style={styles.inputWrap}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Tanya pada Doobie..."
                  placeholderTextColor={Colors.placeholder}
                  style={styles.input}
                  multiline
                />
              </View>
              {text.trim() ? (
                <Pressable accessibilityLabel="Kirim" disabled={typing} onPress={send} style={styles.send}>
                  <Feather name="send" size={20} color="#FFFFFF" />
                </Pressable>
              ) : (
                <Pressable accessibilityLabel="Rekam voice note" disabled={typing} onPress={startRecording} style={styles.send}>
                  <Feather name="mic" size={20} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function TextBubble({ message }: { message: Extract<DoobieMessage, { type: 'text' }> }) {
  const mine = message.from === 'me';
  return (
    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <AppText style={[styles.bubbleText, mine && { color: '#FFFFFF' }]}>{message.text}</AppText>
    </View>
  );
}

// voice note: putar/jeda rekaman, gelombang ikut terisi sesuai progres
function VoiceBubble({ message }: { message: Extract<DoobieMessage, { type: 'voice' }> }) {
  const player = useAudioPlayer(message.uri);
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || message.durationMs / 1000;
  const progress = duration ? Math.min(status.currentTime / duration, 1) : 0;

  const toggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || status.currentTime >= duration - 0.1) player.seekTo(0);
    player.play();
  };

  return (
    <View style={[styles.bubble, styles.bubbleMine, styles.voice]}>
      <Pressable accessibilityLabel={status.playing ? 'Jeda' : 'Putar'} onPress={toggle} style={styles.play}>
        <Feather name={status.playing ? 'pause' : 'play'} size={16} color={Colors.primary} />
      </Pressable>
      <View style={styles.wave}>
        {WAVE.map((h, i) => (
          <View
            key={i}
            style={[styles.waveBar, { height: h, opacity: i / WAVE.length <= progress && progress > 0 ? 1 : 0.45 }]}
          />
        ))}
      </View>
      <AppText style={styles.voiceTime}>
        {fmtDuration((status.playing ? status.currentTime : duration) * 1000)}
      </AppText>
    </View>
  );
}

function TypingBubble() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.bubble, styles.bubbleTheirs, styles.typing]}>
      {[0, 1, 2].map((i) => (
        <TypingDot key={i} delay={i * 150} />
      ))}
    </Animated.View>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(withTiming(0, { duration: delay }), withTiming(-4, { duration: 250 }), withTiming(0, { duration: 250 })),
      -1
    );
  }, [y, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.typingDot, style]} />;
}

function PulseDot() {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.3, { duration: 600 }), -1, true);
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.recDot, style]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  more: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    padding: 16,
    gap: 12,
  },
  intro: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  introImg: {
    width: 120,
    height: 100,
  },
  introTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
  },
  bubbleWrap: {
    alignItems: 'flex-start',
    maxWidth: '86%',
  },
  alignEnd: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  play: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  voiceTime: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
    minWidth: 30,
  },
  typing: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 16,
    alignSelf: 'flex-start',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  topicBar: {
    flexGrow: 0,
  },
  topics: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topic: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  topicText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.primary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrap: {
    flex: 1,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  input: {
    maxHeight: 100,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 10,
  },
  send: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelRec: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 16,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.red,
  },
  recTime: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
});
