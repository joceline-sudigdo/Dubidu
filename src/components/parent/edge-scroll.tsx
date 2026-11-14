import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

// padding samping konten Screen
const GUTTER = 20;
// ruang atas/bawah supaya bayangan & tepi bawah pill/kartu tidak terpotong oleh ScrollView;
// dikompensasi margin negatif sehingga jarak ke elemen lain tidak berubah
const SHADOW_TOP = 4;
const SHADOW_BOTTOM = 14;

// scroll horizontal yang melebar sampai tepi layar (tidak terpotong padding halaman),
// item pertama tetap sejajar dengan konten lain
export function EdgeScroll({ style, contentContainerStyle, ...rest }: ScrollViewProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.bleed, style]}
      contentContainerStyle={[contentContainerStyle, styles.pad]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -GUTTER,
    marginTop: -SHADOW_TOP,
    marginBottom: -SHADOW_BOTTOM,
    flexGrow: 0,
  },
  pad: {
    paddingHorizontal: GUTTER,
    paddingTop: SHADOW_TOP,
    paddingBottom: SHADOW_BOTTOM,
  },
});
