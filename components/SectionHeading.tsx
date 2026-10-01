import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { colors, spacing } from '@/lib/theme';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  withDash?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  withDash = true,
}: Props) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? (
        <AppText variant="label" style={styles.eyebrow}>
          {eyebrow}
          {withDash ? ' —' : ''}
        </AppText>
      ) : null}
      <AppText variant="section" style={styles.title}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText muted style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  eyebrow: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  title: { maxWidth: 320 },
  subtitle: {
    marginTop: spacing.sm,
    maxWidth: 300,
  },
});
