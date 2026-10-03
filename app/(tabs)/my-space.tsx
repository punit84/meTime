import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { MOODS } from '@/lib/moods';
import { appImages } from '@/lib/images';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

/** Sections that belong to later phases — show empty states. */
const OTHER_SPACE_SECTIONS = [
  {
    id: 'journal',
    title: 'My Journal',
    icon: 'book-outline' as const,
    emptyTitle: 'Your pages are waiting.',
    emptySubtitle: 'My thoughts will have a place here.',
  },
  {
    id: 'voice',
    title: 'My Voice',
    icon: 'mic-outline' as const,
    emptyTitle: 'Your voice is yours.',
    emptySubtitle: 'Private recordings will appear here.',
  },
  {
    id: 'memories',
    title: 'My Memories',
    icon: 'images-outline' as const,
    emptyTitle: 'Nothing saved yet.',
    emptySubtitle: 'Little moments will live here.',
  },
];

export default function MySpaceScreen() {
  const router = useRouter();
  const { todayMood, mirrorEntries } = useApp();

  // Find the mood config for today's mood
  const moodConfig = todayMood
    ? MOODS.find((m) => m.id === todayMood.mood)
    : null;

  const mirrorCount = mirrorEntries.length;

  return (
    <Screen>
      {/* Hero */}
      <View style={styles.heroWrap}>
        <ImageBackground
          source={appImages.mySpaceHero}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel="Warm personal space with open journal, candle, and soft morning light"
        >
          <LinearGradient
            colors={[
              'rgba(74,59,52,0.0)',
              'rgba(74,59,52,0.28)',
              'rgba(74,59,52,0.68)',
            ]}
            style={styles.overlay}
          />
          <View style={styles.heroContent}>
            <AppText style={styles.heroLabel}>SANCTUARY</AppText>
            <AppText style={styles.heroTitle}>My Space</AppText>
            <AppText style={styles.heroSubtitle}>
              Your private collection of moments, pages, and soft keepsakes.
            </AppText>
          </View>
        </ImageBackground>
      </View>

      {/* Today's Mood (subtle) */}
      {moodConfig ? (
        <View
          style={[styles.moodCard, { backgroundColor: moodConfig.wash }]}
          accessibilityRole="text"
          accessibilityLabel={`Today's mood: ${moodConfig.title}`}
        >
          <Ionicons name={moodConfig.icon} size={18} color={moodConfig.accent} />
          <View style={styles.moodCopy}>
            <AppText muted style={styles.moodLabel}>
              Today’s mood
            </AppText>
            <AppText style={styles.moodTitle}>{moodConfig.title}</AppText>
          </View>
        </View>
      ) : (
        <View
          style={[styles.moodCard, { backgroundColor: colors.surfaceWarm }]}
          accessibilityRole="text"
        >
          <Ionicons name="leaf-outline" size={18} color={colors.textMuted} />
          <View style={styles.moodCopy}>
            <AppText muted style={styles.moodLabel}>
              Today’s mood
            </AppText>
            <AppText style={styles.moodTitle}>Not checked in yet</AppText>
          </View>
        </View>
      )}

      {/* My Mirror Section Card */}
      <Pressable
        onPress={() => router.push(mirrorCount > 0 ? '/mirror/gallery' : '/mirror')}
        style={({ pressed }) => [styles.sectionCard, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`My Mirror. ${mirrorCount > 0 ? `${mirrorCount} saved moments` : 'Nothing saved yet'}`}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="eye-outline" size={16} color={colors.icon} />
          </View>
          <View style={styles.sectionTitleWrap}>
            <AppText style={styles.sectionTitle}>My Mirror</AppText>
            {mirrorCount > 0 && (
              <AppText muted style={styles.sectionMeta}>
                {mirrorCount} saved moment{mirrorCount > 1 ? 's' : ''}
              </AppText>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>

        {mirrorCount === 0 ? (
          <EmptyState
            icon="eye-outline"
            title="Nothing saved yet."
            subtitle="Your moments with yourself will appear here."
          />
        ) : (
          <View style={styles.mirrorThumbnailsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScrollContent}
            >
              {mirrorEntries.slice(0, 6).map((entry) => (
                <View key={entry.id} style={styles.miniThumbWrap}>
                  <Image
                    source={{ uri: entry.uri }}
                    style={styles.miniThumb}
                    resizeMode="cover"
                  />
                  {entry.type === 'video' && (
                    <View style={styles.miniPlayIcon}>
                      <Ionicons name="play" size={10} color={colors.white} />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </Pressable>

      {/* Other Space sections with empty states */}
      {OTHER_SPACE_SECTIONS.map((section) => (
        <View key={section.id} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name={section.icon} size={16} color={colors.icon} />
            </View>
            <AppText style={styles.sectionTitle}>{section.title}</AppText>
          </View>
          <EmptyState
            icon={section.icon}
            title={section.emptyTitle}
            subtitle={section.emptySubtitle}
          />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  hero: {
    width: '100%',
    aspectRatio: 1376 / 768,
    borderRadius: radii.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: radii.xl,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    zIndex: 2,
  },
  heroLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255,251,247,0.88)',
    marginBottom: 2,
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 30,
    color: colors.white,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,251,247,0.92)',
    maxWidth: 260,
  },

  // Mood card
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  moodCopy: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  moodTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 1,
  },

  // Section cards
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sectionMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  mirrorThumbnailsRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  thumbnailScrollContent: {
    gap: spacing.sm,
  },
  miniThumbWrap: {
    width: 64,
    height: 80,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  miniThumb: {
    width: '100%',
    height: '100%',
  },
  miniPlayIcon: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});
