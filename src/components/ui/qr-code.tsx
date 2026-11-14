import generateQr from 'qrcode-generator';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// Menggambar QR dari teks (mis. QRIS dinamis) dengan kotak-kotak View biasa:
// tanpa modul native, jadi jalan di Expo Go, APK, dan web.

type Run = { row: number; start: number; length: number };

/** Deretan kotak gelap per baris (kotak bersebelahan digabung supaya jumlah View sedikit) */
function darkRuns(text: string) {
  const qr = generateQr(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const runs: Run[] = [];
  for (let row = 0; row < count; row++) {
    let start = -1;
    for (let col = 0; col <= count; col++) {
      const dark = col < count && qr.isDark(row, col);
      if (dark && start < 0) start = col;
      if (!dark && start >= 0) {
        runs.push({ row, start, length: col - start });
        start = -1;
      }
    }
  }
  return { count, runs };
}

export function QrCode({ value, size = 230 }: { value: string; size?: number }) {
  const { count, runs } = useMemo(() => darkRuns(value), [value]);
  // ukuran kotak dibulatkan ke piksel utuh supaya garis QR tajam dan mudah di-scan
  const cell = Math.max(1, Math.floor(size / count));
  const inner = cell * count;

  return (
    <View accessibilityRole="image" accessibilityLabel="Kode QRIS" style={[styles.frame, { padding: cell * 3 }]}>
      <View style={{ width: inner, height: inner }}>
        {runs.map((r) => (
          <View
            key={`${r.row}-${r.start}`}
            style={[styles.dark, { top: r.row * cell, left: r.start * cell, width: r.length * cell, height: cell }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignSelf: 'center',
  },
  dark: {
    position: 'absolute',
    backgroundColor: '#000000',
  },
});
