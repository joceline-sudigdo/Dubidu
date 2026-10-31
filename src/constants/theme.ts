import { Platform } from 'react-native';

export const Colors = {
  primary: '#3D7ABD',
  primaryDark: '#1E528A',
  primarySoft: '#E8F0F9',
  background: '#FFFFFF',

  text: '#22324A',
  textSecondary: '#6B7A90',
  textMuted: '#A3AEBD',
  placeholder: '#9AA6B6',

  inputBackground: '#F2F6FB',
  border: '#E3EAF3',
  disabled: '#C5D3E4',

  green: '#5B8C6A',
  greenSoft: '#E6F0E9',
  yellow: '#FFCB4C',
  yellowSoft: '#FFF5DC',
  red: '#C93D35',
  redSoft: '#FBE9E8',
  blueSoft: '#E1ECF8',
  blueMid: '#C9DBF0',
  surface: '#F5F8FC',
  yellowDark: '#9A6A00',

  shadow: '#1E528A',
} as const;

export const Fonts = {
  logo: 'FredokaOne_400Regular',
  heading: 'Poppins_700Bold',
  headingSemiBold: 'Poppins_600SemiBold',
  body: 'Lato_400Regular',
  bodyBold: 'Lato_700Bold',
  bodyLight: 'Lato_300Light',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const Shadow = {
  soft: Platform.select({
    web: { boxShadow: '0px 6px 18px rgba(30, 82, 138, 0.10)' },
    default: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
  }),
  clay: Platform.select({
    web: { boxShadow: '0px 8px 20px rgba(30, 82, 138, 0.12)' },
    default: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 5,
    },
  }),
  button: Platform.select({
    web: { boxShadow: '0px 10px 20px rgba(61, 122, 189, 0.30)' },
    default: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 6,
    },
  }),
};

export const MaxContentWidth = 480;
