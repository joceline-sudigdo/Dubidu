import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill } from '@/components/parent/pill';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import type { ChatMessage } from '@/data/parent';
import { contracts } from '@/data/contracts';
import { consultations } from '@/data/psychologist';
import { students } from '@/data/teacher';
import { findTeacher, teacherIdByName } from '@/data/teachers';
import { addMessage, clearThread, useChatThreads } from '@/lib/chat-store';
import { showActionSheet, showAlert } from '@/lib/dialog';

const EMOJIS = ['😊', '😄', '🥰', '🙏', '👍', '👏', '🤗', '😅', '😢', '😮', '❤️', '💪', '🎉', '✨', '🌟', '📚', '🧸', '🍎'];

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threads = useChatThreads();
  const thread = threads.find((t) => t.id === id) ?? threads[0];
  const messages = thread.messages;
  const [text, setText] = useState('');
  const [approved, setApproved] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const send = () => {
    const value = text.trim();
    if (!value) return;
    addMessage(thread.id, { id: String(Date.now()), from: 'me', type: 'text', text: value, time: nowTime(), read: false });
    setText('');
  };

  const attach = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    addMessage(thread.id, {
      id: String(Date.now()),
      from: 'me',
      type: 'image',
      uri: result.assets[0].uri,
      time: nowTime(),
      read: false,
    });
  };

  const [muted, setMuted] = useState(false);

  // tujuan "Lihat profil" & kontrak tergantung lawan chat
  const openProfile = () => {
    if (thread.owner === 'teacher') {
      const student = students.find((s) => s.chatId === thread.id);
      const childId = student?.id ?? (thread.id.startsWith('tc-c-') ? thread.id.slice(3) : undefined);
      if (childId) router.push({ pathname: '/teacher/anak/[id]', params: { id: childId } });
      return;
    }
    if (thread.owner === 'psychologist') {
      const consultation = consultations.find((c) => c.chatId === thread.id);
      if (consultation) router.push({ pathname: '/psikolog/konsultasi/[id]', params: { id: consultation.id } });
      return;
    }
    if (thread.role.startsWith('Psikolog')) {
      router.push({ pathname: '/konsultasi/[id]', params: { id: thread.id } });
      return;
    }
    const teacherId = findTeacher(thread.id)?.id ?? teacherIdByName(thread.name);
    if (teacherId) router.push({ pathname: '/profil-teacher/[id]', params: { id: teacherId } });
  };
  const contract = contracts.find((c) =>
    thread.owner === 'teacher' ? c.parentChatId === thread.id && !c.id.startsWith('m-') : c.teacherChatId === thread.id
  );

  const openMenu = () =>
    showActionSheet({
      title: thread.name,
      options: [
        { label: thread.owner === 'teacher' ? 'Lihat profil anak' : 'Lihat profil', icon: 'user', onPress: openProfile },
        ...(contract
          ? [
              {
                label: 'Detail kontrak',
                icon: 'file-text' as const,
                onPress: () => router.push({ pathname: '/kontrak/[id]', params: { id: contract.id } }),
              },
            ]
          : []),
        {
          label: muted ? 'Aktifkan notifikasi' : 'Bisukan notifikasi',
          icon: muted ? 'bell' : 'bell-off',
          onPress: () => {
            setMuted((m) => !m);
            showAlert(muted ? 'Notifikasi diaktifkan' : 'Notifikasi dibisukan');
          },
        },
        {
          label: 'Laporkan',
          icon: 'flag',
          destructive: true,
          onPress: () =>
            showAlert('Laporkan percakapan?', 'Tim Dubidu akan meninjau percakapan ini.', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Laporkan', style: 'destructive', onPress: () => showAlert('Laporan terkirim') },
            ]),
        },
        {
          label: 'Hapus percakapan',
          icon: 'trash-2',
          destructive: true,
          onPress: () =>
            showAlert('Hapus percakapan?', 'Semua pesan di percakapan ini akan dihapus.', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Hapus', style: 'destructive', onPress: () => clearThread(thread.id) },
            ]),
        },
      ],
    });

  const toggleEmoji = () => {
    Keyboard.dismiss();
    setEmojiOpen((o) => !o);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <BackButton />
          <View style={styles.flex}>
            <View style={styles.inline}>
              <AppText style={styles.name} numberOfLines={1}>
                {thread.name}
              </AppText>
              {thread.verified && <MaterialCommunityIcons name="check-decagram" size={18} color={Colors.primary} />}
            </View>
            <View style={styles.inline}>
              <View style={[styles.statusDot, !thread.online && { backgroundColor: Colors.textMuted }]} />
              <AppText variant="caption">{thread.online ? 'Online' : 'Terakhir dilihat baru saja'}</AppText>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Menu lainnya"
            onPress={openMenu}
            style={styles.more}>
            <Feather name="more-vertical" size={20} color={Colors.text} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled">
            <View style={styles.secure}>
              <Feather name="lock" size={16} color={Colors.textSecondary} />
              <AppText variant="caption" style={styles.flex}>
                Kamu terhubung secara aman dengan{' '}
                <AppText style={styles.secureBold}>{thread.name.split(' ')[0]}</AppText> untuk {thread.child}
              </AppText>
            </View>
            <View style={styles.dateChip}>
              <AppText style={styles.dateChipText}>Hari Ini</AppText>
            </View>

            {messages.map((m) =>
              m.type === 'schedule' ? (
                <ScheduleCard key={m.id} message={m} approved={approved} onApprove={() => setApproved(true)} />
              ) : m.type === 'image' ? (
                <ImageBubble key={m.id} message={m} />
              ) : (
                <Bubble key={m.id} message={m} />
              )
            )}
          </ScrollView>

          <View style={styles.inputBar}>
            <View style={styles.inputWrap}>
              <Pressable accessibilityLabel="Lampirkan gambar" hitSlop={6} onPress={attach}>
                <Feather name="paperclip" size={20} color={Colors.textSecondary} />
              </Pressable>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Tulis pesan..."
                placeholderTextColor={Colors.placeholder}
                style={styles.input}
                multiline
                onFocus={() => setEmojiOpen(false)}
              />
              <Pressable accessibilityLabel="Pilih emoji" hitSlop={6} onPress={toggleEmoji}>
                <Feather name="smile" size={20} color={emojiOpen ? Colors.primary : Colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable
              accessibilityLabel="Kirim"
              onPress={send}
              style={[styles.send, !text.trim() && { opacity: 0.6 }]}>
              <Feather name="send" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          {emojiOpen && (
            <View style={styles.emojiPanel}>
              {EMOJIS.map((e) => (
                <Pressable key={e} onPress={() => setText((t) => t + e)} style={styles.emojiKey}>
                  <AppText style={styles.emoji}>{e}</AppText>
                </Pressable>
              ))}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Bubble({ message }: { message: Extract<ChatMessage, { type: 'text' }> }) {
  const mine = message.from === 'me';
  return (
    <View style={[styles.bubbleWrap, mine && styles.alignEnd]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <AppText style={[styles.bubbleText, mine && { color: '#FFFFFF' }]}>{message.text}</AppText>
      </View>
      <View style={styles.inline}>
        <AppText variant="caption">{message.time}</AppText>
        {mine && (
          <MaterialCommunityIcons
            name="check-all"
            size={16}
            color={message.read ? Colors.primary : Colors.textMuted}
          />
        )}
      </View>
    </View>
  );
}

function ImageBubble({ message }: { message: Extract<ChatMessage, { type: 'image' }> }) {
  return (
    <View style={[styles.bubbleWrap, styles.alignEnd]}>
      <Image source={{ uri: message.uri }} style={styles.imageBubble} contentFit="cover" />
      <View style={styles.inline}>
        <AppText variant="caption">{message.time}</AppText>
        <MaterialCommunityIcons name="check-all" size={16} color={message.read ? Colors.primary : Colors.textMuted} />
      </View>
    </View>
  );
}

function ScheduleCard({
  message,
  approved,
  onApprove,
}: {
  message: Extract<ChatMessage, { type: 'schedule' }>;
  approved: boolean;
  onApprove: () => void;
}) {
  return (
    <View style={styles.bubbleWrap}>
      <View style={styles.schedule}>
        <View style={styles.scheduleHead}>
          <View style={styles.scheduleIcon}>
            <Feather name="calendar" size={20} color={Colors.yellowDark} />
          </View>
          <View style={styles.flex}>
            <AppText style={styles.scheduleLabel}>JADWAL UJI COBA (TRIAL)</AppText>
            <AppText style={styles.scheduleTitle}>{message.title}</AppText>
          </View>
          <Pill label={approved ? 'Disetujui' : 'Siap Konfirmasi'} tone={approved ? 'green' : 'blue'} />
        </View>
        <View style={styles.scheduleDivider} />
        <ScheduleRow icon="calendar" text={message.date} />
        <ScheduleRow icon="clock" text={message.hours} />
        <ScheduleRow icon="map-pin" text={message.place} />
        {!approved && (
          <View style={styles.scheduleActions}>
            <Pressable onPress={onApprove} style={styles.approve}>
              <AppText style={styles.approveText}>Setujui Sesi Ini</AppText>
            </Pressable>
            <Pressable
              onPress={() => showAlert('Ubah jadwal', 'Fitur ini akan segera tersedia.')}
              style={styles.change}>
              <AppText style={styles.changeText}>Ubah</AppText>
            </Pressable>
          </View>
        )}
      </View>
      <AppText variant="caption">{message.time}</AppText>
    </View>
  );
}

function ScheduleRow({ icon, text }: { icon: 'calendar' | 'clock' | 'map-pin'; text: string }) {
  return (
    <View style={styles.scheduleRow}>
      <Feather name={icon} size={18} color={Colors.primary} />
      <AppText style={styles.scheduleText}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    flexShrink: 1,
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
    gap: 14,
  },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  secureBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.text,
  },
  dateChip: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateChipText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bubbleWrap: {
    alignItems: 'flex-start',
    gap: 4,
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
  schedule: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.yellow,
    padding: 16,
    gap: 10,
  },
  scheduleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.yellowDark,
  },
  scheduleTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  approve: {
    flex: 1,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  change: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 10,
  },
  emojiPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  emojiKey: {
    width: `${100 / 9}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  imageBubble: {
    width: 220,
    height: 220,
    borderRadius: 22,
    borderBottomRightRadius: 6,
  },
  send: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
