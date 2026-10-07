import {
  Alert,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { FeatureAction } from '@/lib/content';

export type DetailScreenProps = {
  title: string;
  subtitle: string;
  tag?: string;
  hero: ImageSourcePropType;
  actions: FeatureAction[];
  reflection: {
    quote: string;
    sub?: string;
  };
  moodWash?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: (action: FeatureAction) => void;
  /** Soft colourful border + corner flowers (Write hub). */
  floralFrame?: boolean;
};

export function FeaturePlaceholder({
  title,
  subtitle,
  tag,
  hero,
  actions,
  reflection,
  moodWash = colors.surfaceWarm,
  actionIcon = 'sparkles-outline',
  onActionPress,
  floralFrame = false,
}: DetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topInsetPadding = Math.max(insets.top, 20) + 8;

  return (
    <Screen padded={false} edges={['left', 'right']}>
      {/* 1. IMMERSIVE HERO WITH TITLE & BACK BUTTON */}
      <View style={styles.heroWrap}>
        <ImageBackground
          source={hero}
          style={styles.hero}
          imageStyle={styles.heroImage}
          accessibilityRole="image"
          accessibilityLabel={`${title} hero background`}
        >
          {/* Top Bar: Floating Back Button & Optional Tag */}
          <View style={[styles.topBar, { paddingTop: topInsetPadding }]}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [
                styles.backBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>

            {tag ? (
              <View style={styles.tagBadge}>
                <AppText style={styles.tagText}>{tag}</AppText>
              </View>
            ) : null}
          </View>

          {/* Lower Hero Gradient & Feature Title */}
          <LinearGradient
            colors={[
              'rgba(40,30,25,0.0)',
              'rgba(40,30,25,0.38)',
              'rgba(40,30,25,0.82)',
            ]}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <AppText style={styles.heroTitle}>{title}</AppText>
            <AppText style={styles.heroSubtitle}>{subtitle}</AppText>
          </View>
        </ImageBackground>
      </View>

      {/* 2. CONTINUOUS CREAM CONTENT SHEET (NO STACKED CARDS, NO DUPLICATE IMAGE) */}
      {floralFrame ? (
        <LinearGradient
          colors={['#E8B4A0', '#D4A5C9', '#A8C5A0', '#F0C9B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floralShell}
        >
          <View style={[styles.sheet, styles.sheetFloral]}>
            <View style={[styles.sheetFlower, styles.sheetFlowerTL]} pointerEvents="none">
              <Ionicons name="flower" size={20} color="#C08B7A" />
            </View>
            <View style={[styles.sheetFlower, styles.sheetFlowerTR]} pointerEvents="none">
              <Ionicons name="rose" size={18} color="#B07A86" />
            </View>
            <View style={styles.handle} />
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => {
                const isLast = index === actions.length - 1;
                return (
                  <Pressable
                    key={action.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${action.title}. ${action.subtitle}`}
                    onPress={() => {
                      if (onActionPress) {
                        onActionPress(action);
                      } else {
                        Alert.alert(action.title, 'Coming in a later phase.');
                      }
                    }}
                    style={({ pressed }) => [
                      styles.actionRow,
                      !isLast && styles.actionDivider,
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.actionIconPill,
                        { backgroundColor: moodWash },
                      ]}
                    >
                      <Ionicons name={actionIcon} size={15} color={colors.icon} />
                    </View>
                    <View style={styles.actionCopy}>
                      <AppText style={styles.actionTitle}>{action.title}</AppText>
                      <AppText muted style={styles.actionSub}>
                        {action.subtitle}
                      </AppText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>
            <View
              style={[styles.reflectionCard, { backgroundColor: moodWash }]}
              accessibilityRole="text"
            >
              <Ionicons
                name="flower-outline"
                size={18}
                color={colors.accentDeep}
                style={styles.reflectionIcon}
              />
              <AppText style={styles.reflectionQuote}>
                “{reflection.quote}”
              </AppText>
              {reflection.sub ? (
                <AppText muted style={styles.reflectionSub}>
                  {reflection.sub}
                </AppText>
              ) : null}
            </View>
            <View style={[styles.sheetFlower, styles.sheetFlowerBR]} pointerEvents="none">
              <Ionicons name="leaf" size={16} color="#8F9E7A" />
            </View>
          </View>
        </LinearGradient>
      ) : (
      <View style={styles.sheet}>
        {/* Soft Handle */}
        <View style={styles.handle} />

        {/* Unified Continuous Actions List Container */}
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => {
            const isLast = index === actions.length - 1;
            return (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                accessibilityLabel={`${action.title}. ${action.subtitle}`}
                onPress={() => {
                  if (onActionPress) {
                    onActionPress(action);
                  } else {
                    Alert.alert(action.title, 'Coming in a later phase.');
                  }
                }}
                style={({ pressed }) => [
                  styles.actionRow,
                  !isLast && styles.actionDivider,
                  pressed && styles.actionPressed,
                ]}
              >
                <View
                  style={[
                    styles.actionIconPill,
                    { backgroundColor: moodWash },
                  ]}
                >
                  <Ionicons name={actionIcon} size={15} color={colors.icon} />
                </View>

                <View style={styles.actionCopy}>
                  <AppText style={styles.actionTitle}>{action.title}</AppText>
                  <AppText muted style={styles.actionSub}>
                    {action.subtitle}
                  </AppText>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>

        {/* 3. REFLECTION / SUPPORTING CONTENT CARD */}
        <View
          style={[styles.reflectionCard, { backgroundColor: moodWash }]}
          accessibilityRole="text"
        >
          <Ionicons
            name="leaf-outline"
            size={18}
            color={colors.accentDeep}
            style={styles.reflectionIcon}
          />
          <AppText style={styles.reflectionQuote}>
            “{reflection.quote}”
          </AppText>
          {reflection.sub ? (
            <AppText muted style={styles.reflectionSub}>
              {reflection.sub}
            </AppText>
          ) : null}
        </View>
      </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    height: 330,
    backgroundColor: colors.surfaceWarm,
  },
  hero: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 251, 247, 0.94)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  tagBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(74, 59, 52, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 251, 247, 0.25)',
  },
  tagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.white,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 14,
    zIndex: 2,
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 36,
    lineHeight: 40,
    color: colors.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255, 251, 247, 0.92)',
    maxWidth: 280,
  },
  sheet: {
    marginTop: -28,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  floralShell: {
    marginTop: -28,
    marginHorizontal: spacing.sm,
    borderRadius: radii.xl + 2,
    padding: 3,
    marginBottom: spacing.sm,
  },
  sheetFloral: {
    marginTop: 0,
    borderRadius: radii.xl,
    backgroundColor: colors.background,
    overflow: 'hidden',
    position: 'relative',
  },
  sheetFlower: {
    position: 'absolute',
    zIndex: 3,
    opacity: 0.9,
  },
  sheetFlowerTL: { top: 14, left: 14 },
  sheetFlowerTR: { top: 14, right: 14 },
  sheetFlowerBR: { bottom: 16, right: 16 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  actionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 24,
    ...shadows.soft,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionPressed: {
    backgroundColor: colors.surfaceWarm,
  },
  actionIconPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  actionTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  reflectionCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  reflectionIcon: {
    marginBottom: spacing.sm,
  },
  reflectionQuote: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  reflectionSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});
