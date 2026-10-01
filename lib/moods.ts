import { colors } from '@/lib/theme';
import type { MoodConfig } from '@/lib/types-phase1';

export const MOODS: MoodConfig[] = [
  {
    id: 'happy',
    title: 'Happy',
    description: 'Feeling light',
    icon: 'sunny-outline',
    wash: colors.surfacePeach,
    accent: colors.accent,
  },
  {
    id: 'sad',
    title: 'Sad',
    description: 'Taking it slow',
    icon: 'rainy-outline',
    wash: colors.surfaceCool,
    accent: colors.textSecondary,
  },
  {
    id: 'calm',
    title: 'Calm',
    description: 'Quiet inside',
    icon: 'leaf-outline',
    wash: colors.surfaceSage,
    accent: colors.icon,
  },
  {
    id: 'uneasy',
    title: 'Uneasy',
    description: 'A little unsettled',
    icon: 'cloudy-outline',
    wash: colors.surfaceLavender,
    accent: colors.accentDeep,
  },
  {
    id: 'glow',
    title: 'Glow',
    description: 'Feeling like me',
    icon: 'sparkles-outline',
    wash: colors.surfaceRose,
    accent: colors.accent,
  },
];
