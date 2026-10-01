export const colors = {
  background: '#F6F1EA',
  surface: '#FFFBF7',
  surfaceWarm: '#F3EBE2',
  surfaceRose: '#F3E4E0',
  surfaceSage: '#E7EDE7',
  surfaceLavender: '#EAE6EF',
  surfacePeach: '#F4E6DA',
  surfaceCool: '#E4E8F0',
  textPrimary: '#4A3B34',
  textSecondary: '#8B7B72',
  textMuted: '#A8978D',
  border: 'rgba(74, 59, 52, 0.08)',
  borderStrong: 'rgba(74, 59, 52, 0.14)',
  accent: '#C08B7A',
  accentDeep: '#8F6558',
  icon: '#6F5B52',
  navigation: '#FFF9F4',
  navigationActive: '#EBD8CF',
  selected: '#4A3B34',
  white: '#FFFFFF',
  overlay: 'rgba(58, 42, 36, 0.28)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
  section: 36,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

export const fonts = {
  display: 'CormorantGaramond_600SemiBold',
  displayBold: 'CormorantGaramond_700Bold',
  body: 'Outfit_400Regular',
  bodyMedium: 'Outfit_500Medium',
  bodySemi: 'Outfit_600SemiBold',
} as const;

export const shadows = {
  soft: {
    shadowColor: '#4A3B34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  nav: {
    shadowColor: '#4A3B34',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
