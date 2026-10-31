import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type Variant = 'title' | 'subtitle' | 'label' | 'body' | 'caption' | 'link';

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  return <Text style={[styles[variant], color ? { color } : null, style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textSecondary,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  link: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.primary,
  },
});
