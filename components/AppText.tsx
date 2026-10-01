import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';

type Variant = 'display' | 'title' | 'section' | 'body' | 'label' | 'caption';

type Props = TextProps & {
  variant?: Variant;
  muted?: boolean;
};

export function AppText({
  variant = 'body',
  muted = false,
  style,
  ...rest
}: Props) {
  return (
    <Text
      {...rest}
      style={[styles.base, styles[variant], muted && styles.muted, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: colors.textPrimary },
  display: {
    fontFamily: fonts.displayBold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
  },
  section: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  muted: { color: colors.textSecondary },
});
