import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

import { ClayCard } from "@/components/parent/clay-card";
import { Screen } from "@/components/parent/screen";
import { ScreenHeader, SectionHeader } from "@/components/parent/screen-header";
import { AppText } from "@/components/ui/app-text";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Colors, Fonts, Radius, Shadow } from "@/constants/theme";
import { api } from "@/lib/api";
import { openSupportChat } from "@/lib/support-chat";

const FAQ = [
  {
    q: "Bagaimana sistem matching bekerja?",
    a: "Dubidu mencocokkan kebutuhan anak dengan keahlian shadow teacher, lalu mempertimbangkan rating dan lokasi. Kamu akan melihat 5 kandidat paling cocok setiap hari.",
  },
  {
    q: "Apakah shadow teacher sudah terverifikasi?",
    a: "Ya. Setiap teacher melewati verifikasi identitas, sertifikat, dan observasi sebelum bisa menerima pendampingan.",
  },
  {
    q: "Bagaimana pembayaran dilakukan?",
    a: "Orang tua membayar per termin. Dana ditahan aman oleh Dubidu dan baru dicairkan ke teacher setelah sesi dan laporan selesai.",
  },
  {
    q: "Bisakah saya mengganti teacher?",
    a: "Bisa. Hubungi tim Dubidu lewat chat bantuan, kami bantu proses penggantian dan penyesuaian kontrak.",
  },
  {
    q: "Kenapa skip dibatasi 5 kali sehari?",
    a: "Supaya proses pencocokan lebih bijak. Pengguna Dubidu Plus bisa melihat lebih banyak kandidat tanpa batas.",
  },
];

export default function BantuanScreen() {
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const [faqs, setFaqs] = useState(FAQ);

  // FAQ yang dipublikasikan dari web admin; daftar bawaan tampil dulu
  useEffect(() => {
    api<{ value: { question: string; answer: string }[] }>("/content/faqs")
      .then(({ value }) => value.length && setFaqs(value.map((f) => ({ q: f.question, a: f.answer }))))
      .catch(() => {});
  }, []);

  const list = faqs.filter((f) =>
    (f.q + f.a).toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Screen
      header={<ScreenHeader title="Pusat Bantuan" />}
      edges={["top", "bottom"]}
    >
      <ClayCard tone="blue" style={styles.hero}>
        <Image
          source={require("@/assets/images/mascot/wait.png")}
          style={styles.bear}
          contentFit="contain"
        />
        <View style={styles.flex}>
          <AppText style={styles.heroTitle}>
            Ada yang bisa Doobie bantu?
          </AppText>
          <AppText variant="caption" color={Colors.text}>
            Cari jawaban cepat atau hubungi tim Dubidu.
          </AppText>
        </View>
      </ClayCard>

      <View style={[styles.search, Shadow.soft]}>
        <Feather name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Cari pertanyaan..."
          placeholderTextColor={Colors.placeholder}
          style={styles.searchInput}
        />
      </View>

      <SectionHeader title="Pertanyaan Populer" />
      {list.map((f, i) => {
        const expanded = open === i;
        return (
          <Animated.View key={f.q} layout={LinearTransition}>
            <ClayCard
              onPress={() => setOpen(expanded ? null : i)}
              style={styles.faq}
            >
              <View style={styles.faqHead}>
                <AppText style={styles.question}>{f.q}</AppText>
                <Feather
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={Colors.primary}
                />
              </View>
              {expanded && (
                <Animated.View entering={FadeIn}>
                  <AppText variant="body" color={Colors.textSecondary}>
                    {f.a}
                  </AppText>
                </Animated.View>
              )}
            </ClayCard>
          </Animated.View>
        );
      })}
      {list.length === 0 && (
        <AppText variant="caption" style={styles.center}>
          Belum ada jawaban untuk pencarian ini.
        </AppText>
      )}

      <SectionHeader title="Masih butuh bantuan?" />
      <PrimaryButton
        title="Chat dengan Tim Dubidu"
        leadingIcon="chat"
        onPress={openSupportChat}
      />
      <Pressable
        onPress={() => Linking.openURL("mailto:dubidu.ed@gmail.com")}
        style={[styles.secondary, Shadow.soft]}
      >
        <Feather name="mail" size={18} color={Colors.primary} />
        <AppText style={styles.secondaryText}>Kirim Email</AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: "center",
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bear: {
    width: 110,
    height: 80,
  },
  heroTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  faq: {
    gap: 10,
    padding: 16,
  },
  faqHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  question: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  secondary: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  secondaryText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.primary,
  },
});
