import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { colors, radii, spacing } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
};

export function PageHeader({
  title,
  subtitle,
  rightSlot,
  onRightPress,
  rightAccessibilityLabel,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <AppText variant="title">{title}</AppText>
          {subtitle ? (
            <AppText muted style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {rightSlot ?? (
          onRightPress ? (
            <Pressable
              onPress={onRightPress}
              accessibilityRole="button"
              accessibilityLabel={rightAccessibilityLabel ?? 'Open voice'}
              style={styles.iconBtn}
            >
              <Ionicons name="mic-outline" size={18} color={colors.icon} />
            </Pressable>
          ) : null
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: { flex: 1 },
  subtitle: {
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
