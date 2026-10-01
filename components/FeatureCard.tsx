import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

type Props = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  wash?: string;
  onPress?: () => void;
};

export function FeatureCard({
  title,
  subtitle,
  image,
  wash = colors.surfaceWarm,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: wash },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.copy}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText muted style={styles.subtitle}>
          {subtitle}
        </AppText>
      </View>
      <Image source={image} style={styles.image} />
      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

type SpaceProps = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  onPress?: () => void;
};

export function SpaceRow({ title, subtitle, image, onPress }: SpaceProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [styles.spaceRow, pressed && styles.pressed]}
    >
      <Image source={image} style={styles.thumb} />
      <View style={styles.spaceCopy}>
        <AppText style={styles.spaceTitle}>{title}</AppText>
        <AppText muted style={styles.spaceSubtitle}>
          {subtitle}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    overflow: 'hidden',
    minHeight: 108,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  pressed: { opacity: 0.94 },
  copy: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    maxWidth: 160,
  },
  image: {
    width: 110,
    height: 108,
  },
  chevron: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
  },
  spaceCopy: { flex: 1 },
  spaceTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  spaceSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
