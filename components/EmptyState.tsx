import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { colors, fonts, spacing } from '@/lib/theme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
};

/**
 * A gentle empty-state placeholder used throughout My Space
 * and other sections when no user data exists yet.
 */
export function EmptyState({
  icon = 'leaf-outline',
  title,
  subtitle,
  style,
}: Props) {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="text"
      accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ''}`}
    >
      <Ionicons
        name={icon}
        size={20}
        color={colors.textMuted}
        style={styles.icon}
      />
      <AppText style={styles.title}>{title}</AppText>
      {subtitle ? (
        <AppText muted style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 220,
  },
});
