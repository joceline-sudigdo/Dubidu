import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

// padding samping konten Screen
const GUTTER = 20;

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
    flexGrow: 0,
  },
  pad: {
    paddingHorizontal: GUTTER,
  },
});
