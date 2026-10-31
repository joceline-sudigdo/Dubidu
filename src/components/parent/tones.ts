import { Colors } from '@/constants/theme';

export type Tone = 'blue' | 'green' | 'red' | 'yellow' | 'gray';

export const Tones: Record<Tone, { bg: string; fg: string; solid: string; edge: string }> = {
  blue: { bg: Colors.primarySoft, fg: Colors.primaryDark, solid: Colors.primary, edge: Colors.blueMid },
  green: { bg: Colors.greenSoft, fg: Colors.green, solid: Colors.green, edge: '#CFE2D5' },
  red: { bg: Colors.redSoft, fg: Colors.red, solid: Colors.red, edge: '#F3CFCC' },
  yellow: { bg: Colors.yellowSoft, fg: Colors.yellowDark, solid: Colors.yellow, edge: '#F6E2AE' },
  gray: { bg: Colors.inputBackground, fg: Colors.textSecondary, solid: Colors.textSecondary, edge: Colors.border },
};
