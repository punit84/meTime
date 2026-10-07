/**
 * Soft colourful page boundary + flower accents for Write screens.
 */
import { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/lib/theme';

type Tone = 'peach' | 'rose' | 'lavender' | 'sage';

const TONES: Record<
  Tone,
  {
    border: [string, string, string, string];
    wash: [string, string, string];
    flower: string;
  }
> = {
  peach: {
    border: ['#E8B4A0', '#F0C9B0', '#D4A5C9', '#A8C5A0'],
    wash: ['#FFF5EE', '#F6F1EA', '#F3EBE2'],
    flower: '#C08B7A',
  },
  rose: {
    border: ['#E2A8B0', '#F0C4B8', '#C9A8D4', '#B5C9A8'],
    wash: ['#FFF6F4', '#F6F1EA', '#F3E4E0'],
    flower: '#B07A86',
  },
  lavender: {
    border: ['#C4B0D8', '#E2B8C8', '#A8C4D4', '#D4B8A0'],
    wash: ['#F7F4FB', '#F6F1EA', '#EAE6EF'],
    flower: '#8F7A9E',
  },
  sage: {
    border: ['#A8C4A8', '#D4C4A0', '#C4A8C4', '#A8B8D4'],
    wash: ['#F4F8F3', '#F6F1EA', '#E7EDE7'],
    flower: '#6F8F6F',
  },
};

type Props = {
  children: ReactNode;
  tone?: Tone;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Extra bottom inset for scroll content inside the frame. */
  padded?: boolean;
};

export function WritePageFrame({
  children,
  tone = 'peach',
  style,
  contentStyle,
  padded = true,
}: Props) {
  const palette = TONES[tone];

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={palette.wash}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Colourful outer boundary */}
      <LinearGradient
        colors={palette.border}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderShell}
      >
        <View style={[styles.inner, padded && styles.innerPadded, contentStyle]}>
          {/* Corner flowers */}
          <View style={[styles.flower, styles.flowerTL]} pointerEvents="none">
            <Ionicons name="flower" size={22} color={palette.flower} />
          </View>
          <View style={[styles.flower, styles.flowerTR]} pointerEvents="none">
            <Ionicons name="rose" size={20} color={palette.border[2]} />
          </View>
          <View style={[styles.flower, styles.flowerBL]} pointerEvents="none">
            <Ionicons name="leaf" size={18} color={palette.border[3]} />
          </View>
          <View style={[styles.flower, styles.flowerBR]} pointerEvents="none">
            <Ionicons name="flower-outline" size={22} color={palette.flower} />
          </View>

          {/* Soft side vine accents */}
          <View style={[styles.vine, styles.vineLeft]} pointerEvents="none">
            <Ionicons name="flower-outline" size={14} color={palette.border[0]} />
            <Ionicons name="leaf-outline" size={12} color={palette.border[3]} />
            <Ionicons name="flower-outline" size={14} color={palette.border[2]} />
          </View>
          <View style={[styles.vine, styles.vineRight]} pointerEvents="none">
            <Ionicons name="rose-outline" size={14} color={palette.border[1]} />
            <Ionicons name="flower-outline" size={12} color={palette.border[0]} />
            <Ionicons name="leaf-outline" size={14} color={palette.border[3]} />
          </View>

          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  borderShell: {
    flex: 1,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    borderRadius: radii.xl + 4,
    padding: 3,
    ...{
      shadowColor: '#8F6558',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 3,
    },
  },
  inner: {
    flex: 1,
    backgroundColor: 'rgba(255,251,247,0.92)',
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  innerPadded: {
    // Keep room for corner flowers
  },
  flower: {
    position: 'absolute',
    zIndex: 2,
    opacity: 0.88,
  },
  flowerTL: { top: 10, left: 10 },
  flowerTR: { top: 12, right: 12 },
  flowerBL: { bottom: 12, left: 12 },
  flowerBR: { bottom: 10, right: 10 },
  vine: {
    position: 'absolute',
    zIndex: 1,
    opacity: 0.55,
    gap: 18,
    alignItems: 'center',
  },
  vineLeft: {
    left: 6,
    top: '28%',
  },
  vineRight: {
    right: 6,
    top: '34%',
  },
});
