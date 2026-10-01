import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { FeatureAction } from '@/lib/content';

type Props = {
  title: string;
  subtitle: string;
  hero: ImageSourcePropType;
  actions: FeatureAction[];
};

export function FeaturePlaceholder({
  title,
  subtitle,
  hero,
  actions,
}: Props) {
  const router = useRouter();

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <View style={styles.heroWrap}>
        <Image source={hero} style={styles.hero} />
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.fade}
        />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.panel}>
        <AppText variant="title">{title}</AppText>
        <AppText muted style={styles.subtitle}>
          {subtitle}
        </AppText>

        <View style={styles.list}>
          {actions.map((action) => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={`${action.title}. Coming soon.`}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.copy}>
                <AppText style={styles.rowTitle}>{action.title}</AppText>
                <AppText muted style={styles.rowSub}>
                  {action.subtitle}
                </AppText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          ))}
        </View>

        <AppText muted style={styles.note}>
          Coming in a later phase — visual shell only for now.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    height: 280,
    backgroundColor: colors.surfaceWarm,
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  back: {
    position: 'absolute',
    top: 54,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  panel: {
    marginTop: -28,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    minHeight: 360,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.92 },
  copy: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  note: {
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: 12,
  },
});
