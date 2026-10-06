import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { images } from '@/lib/images';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

export default function WriteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInsetPadding = Math.max(insets.top, 20) + 8;

  return (
    <Screen padded={false} edges={['left', 'right']}>
      {/* 1. Full-Bleed Hero */}
      <View style={styles.heroWrap}>
        <ImageBackground
          source={images.write.hero}
          style={styles.hero}
          imageStyle={styles.heroImage}
          accessibilityRole="image"
          accessibilityLabel="Write quiet sanctuary hero"
        >
          {/* Floating Back Button & Tag */}
          <View style={[styles.topBar, { paddingTop: topInsetPadding }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.tagBadge}>
              <AppText style={styles.tagText}>JOURNAL</AppText>
            </View>
          </View>

          {/* Hero Gradient & Title */}
          <LinearGradient
            colors={[
              'rgba(40,30,25,0.0)',
              'rgba(40,30,25,0.38)',
              'rgba(40,30,25,0.85)',
            ]}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <AppText style={styles.heroTitle}>Write</AppText>
            <AppText style={styles.heroSubtitle}>
              Put your thoughts somewhere safe.
            </AppText>
          </View>
        </ImageBackground>
      </View>

      {/* 2. Overlapping Cream Sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Action Rows Container */}
        <View style={styles.actionsContainer}>
          {/* Action 1: New Journal Entry */}
          <Pressable
            onPress={() => router.push('/write/new')}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionDivider,
              pressed && styles.actionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="New Journal Entry. Write a private page."
          >
            <View style={[styles.actionIconPill, { backgroundColor: colors.surfacePeach }]}>
              <Ionicons name="create-outline" size={17} color={colors.icon} />
            </View>
            <View style={styles.actionCopy}>
              <AppText style={styles.actionTitle}>New Journal Entry</AppText>
              <AppText muted style={styles.actionSub}>
                Write a private page
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Action 2: My Entries */}
          <Pressable
            onPress={() => router.push('/write/entries')}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionDivider,
              pressed && styles.actionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="My Entries. Everything you've written."
          >
            <View style={[styles.actionIconPill, { backgroundColor: colors.surfaceRose }]}>
              <Ionicons name="book-outline" size={17} color={colors.icon} />
            </View>
            <View style={styles.actionCopy}>
              <AppText style={styles.actionTitle}>My Entries</AppText>
              <AppText muted style={styles.actionSub}>
                Everything you&apos;ve written
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Action 3: Add Photo */}
          <Pressable
            onPress={() => router.push('/write/photo')}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionDivider,
              pressed && styles.actionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add Photo. Keep a page, poem, or handwritten thought."
          >
            <View style={[styles.actionIconPill, { backgroundColor: colors.surfaceSage }]}>
              <Ionicons name="image-outline" size={17} color={colors.icon} />
            </View>
            <View style={styles.actionCopy}>
              <AppText style={styles.actionTitle}>Add Photo</AppText>
              <AppText muted style={styles.actionSub}>
                Keep a page, poem, or handwritten thought
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Action 4: Private Notes */}
          <Pressable
            onPress={() => router.push('/write/notes')}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
            accessibilityRole="button"
            accessibilityLabel="Private Notes. Short thoughts, safely held."
          >
            <View style={[styles.actionIconPill, { backgroundColor: colors.surfaceWarm }]}>
              <Ionicons name="document-text-outline" size={17} color={colors.icon} />
            </View>
            <View style={styles.actionCopy}>
              <AppText style={styles.actionTitle}>Private Notes</AppText>
              <AppText muted style={styles.actionSub}>
                Short thoughts, safely held
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Reflection Card */}
        <View style={[styles.reflectionCard, { backgroundColor: colors.surfacePeach }]}>
          <Ionicons
            name="leaf-outline"
            size={18}
            color={colors.accentDeep}
            style={styles.reflectionIcon}
          />
          <AppText style={styles.reflectionQuote}>
            &ldquo;Unspoken thoughts find a safe harbor here. Write without judgment.&rdquo;
          </AppText>
          <AppText muted style={styles.reflectionSub}>
            Private pages, poems, handwritten keepsakes, and quiet reflections held gently.
          </AppText>
        </View>
      </View>
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
