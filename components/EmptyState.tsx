import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { colors, fonts, radii, spacing } from '@/lib/theme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
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
  message,
  actionLabel,
  onAction,
  style,
}: Props) {
  const displaySubtitle = subtitle || message;

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="text"
      accessibilityLabel={`${title}${displaySubtitle ? `. ${displaySubtitle}` : ''}`}
    >
      <Ionicons
        name={icon}
        size={24}
        color={colors.textMuted}
        style={styles.icon}
      />
      <AppText style={styles.title}>{title}</AppText>
      {displaySubtitle ? (
        <AppText muted style={styles.subtitle}>
          {displaySubtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && styles.actionBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <AppText style={styles.actionBtnText}>{actionLabel}</AppText>
        </Pressable>
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
    opacity: 0.7,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnPressed: {
    opacity: 0.8,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textPrimary,
  },
});
