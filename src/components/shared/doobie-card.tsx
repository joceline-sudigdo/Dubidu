import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { doobieTopics } from '@/data/doobie';
import { getSession } from '@/lib/session';

// pilih topik / ketik / mic di sini, lanjut ngobrol di halaman chat Doobie
export function DoobieCard({ message }: { message: string }) {
  const [text, setText] = useState('');
  const topics = doobieTopics[getSession().role === 'teacher' ? 'teacher' : 'parent'];

  const ask = () => {
    if (!text.trim()) return;
    router.push({ pathname: '/doobie', params: { q: text.trim() } });
    setText('');
  };

  return (
    <ClayCard tone="blue" style={styles.doobie}>
      <AppText style={styles.doobieTitle}>Apa yang bisa Doobie bantu hari ini?</AppText>
      <View style={styles.doobieRow}>
        <Image source={require('@/assets/images/mascot/wait.png')} style={styles.doobieImg} contentFit="contain" />
        <View style={styles.doobieBubble}>
          <AppText variant="caption" color={Colors.text}>
            {message}
          </AppText>
        </View>
      </View>
      <View style={styles.askField}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={ask}
          returnKeyType="send"
          placeholder="Yuk tanya pada Doobie!"
          placeholderTextColor={Colors.placeholder}
          style={styles.askInput}
        />
        <Pressable
          accessibilityLabel={text.trim() ? 'Kirim pertanyaan' : 'Kirim voice note'}
          onPress={() => (text.trim() ? ask() : router.push({ pathname: '/doobie', params: { voice: '1' } }))}
          style={styles.mic}>
          <Feather name={text.trim() ? 'send' : 'mic'} size={16} color="#FFFFFF" />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
        {topics.map((t) => (
          <Pill
            key={t.id}
            label={t.label}
            size="md"
            tone="blue"
            onPress={() => router.push({ pathname: '/doobie', params: { topic: t.id } })}
            style={styles.topicIdle}
          />
        ))}
      </ScrollView>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  doobie: {
    gap: 14,
  },
  doobieTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
  },
  doobieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doobieImg: {
    width: 150,
    height: 120,
    marginLeft: -16,
    marginRight: -12,
  },
  doobieBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 12,
  },
  askField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingLeft: 18,
    paddingRight: 6,
    height: 48,
  },
  askInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  mic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicRow: {
    gap: 8,
    paddingBottom: 4,
  },
  topicIdle: {
    backgroundColor: '#FFFFFF',
  },
});
