import { useMemo } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/AppText';
import { MiniPlayer } from '@/components/MiniPlayer';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { PLAYLISTS } from '@/lib/content';
import { appImages } from '@/lib/images';
import {
  getMusicCategory,
  isMusicCategoryId,
  listenCategoryForHomeMood,
  randomMusicCategory,
} from '@/lib/music';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { MusicCategoryId } from '@/lib/types';

export default function ListenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { todayMood } = useApp();

  const moodSuggestion = useMemo(
    () => listenCategoryForHomeMood(todayMood?.mood),
    [todayMood?.mood],
  );

  const openCategory = (id: MusicCategoryId, options?: { surprise?: boolean }) => {
    router.push({
      pathname: '/music/category',
      params: {
        id,
        ...(options?.surprise ? { surprise: '1' } : {}),
      },
    });
  };

  const handlePlaylistPress = (id: string) => {
    if (!isMusicCategoryId(id)) {
      Alert.alert('Listen', 'That mood isn’t available yet.');
      return;
    }
    openCategory(id);
  };

  const handleSurpriseMe = () => {
    openCategory(randomMusicCategory(Date.now()), { surprise: true });
  };

  const handleTodayPlaylist = () => {
    openCategory(moodSuggestion ?? 'calm');
  };

  const handleSearch = () => {
    router.push('/music/search');
  };

  // Tab bar ~66 + safe area — keep mini player above it
  const miniBottom = 66 + Math.max(insets.bottom, 12) + 8;

  return (
    <Screen contentStyle={{ paddingBottom: miniBottom + 72 }}>
      <View style={styles.heroWrap}>
        <ImageBackground
          source={appImages.listenHero}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel="Cozy bed and warm sunlight with headphones"
        >
          <LinearGradient
            colors={['rgba(74,59,52,0.0)', 'rgba(74,59,52,0.28)', 'rgba(74,59,52,0.68)']}
            style={styles.overlay}
          />
          <View style={styles.heroContent}>
            <AppText style={styles.heroLabel}>SANCTUARY</AppText>
            <AppText style={styles.heroTitle}>Listen</AppText>
            <AppText style={styles.heroSubtitle}>
              Find something that fits the moment.
            </AppText>
          </View>
        </ImageBackground>
      </View>

      {/* Search — additive, matches existing surface language */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search songs, artists, albums"
        onPress={handleSearch}
        style={({ pressed }) => [styles.searchRow, pressed && styles.pressed]}
      >
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <AppText muted style={styles.searchPlaceholder}>
          Search songs, artists, albums...
        </AppText>
      </Pressable>

      {moodSuggestion && (
        <View style={styles.moodTip}>
          <AppText muted style={styles.moodTipLabel}>
            Picked for your mood
          </AppText>
          <AppText style={styles.moodTipBody}>
            Today you’re feeling{' '}
            {todayMood?.mood
              ? todayMood.mood.charAt(0).toUpperCase() + todayMood.mood.slice(1)
              : 'soft'}
            .
          </AppText>
          <Pressable
            onPress={() => {
              openCategory(moodSuggestion);
            }}
            style={({ pressed }) => [styles.moodTipBtn, pressed && styles.pressed]}
          >
            <AppText style={styles.moodTipBtnText}>
              Try {getMusicCategory(moodSuggestion).title}
            </AppText>
            <Ionicons name="chevron-forward" size={14} color={colors.accentDeep} />
          </Pressable>
        </View>
      )}

      <AppText variant="label" style={styles.sectionLabel}>
        Today’s Playlist
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Today's Playlist. Soft sounds for an easy evening."
        onPress={handleTodayPlaylist}
        style={({ pressed }) => [styles.todayCard, pressed && styles.pressed]}
      >
        <View style={styles.todayCopy}>
          <AppText style={styles.todayTitle}>Soft sounds for an easy evening</AppText>
          <AppText muted style={styles.todaySub}>
            Curated calm sounds for your current space
          </AppText>
        </View>
        <View style={styles.playBtn}>
          <Ionicons name="play" size={16} color={colors.white} />
        </View>
      </Pressable>

      {/* Surprise Me — additive card, same visual language */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Surprise Me. Let a mood pick music for you."
        onPress={handleSurpriseMe}
        style={({ pressed }) => [styles.surpriseCard, pressed && styles.pressed]}
      >
        <View style={styles.surpriseIcon}>
          <Ionicons name="shuffle-outline" size={18} color={colors.accentDeep} />
        </View>
        <View style={styles.todayCopy}>
          <AppText style={styles.todayTitle}>Surprise Me</AppText>
          <AppText muted style={styles.todaySub}>
            Let a mood pick something real for you
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>

      <AppText variant="label" style={styles.sectionLabel}>
        Mood Playlists
      </AppText>

      {PLAYLISTS.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.subtitle}`}
          onPress={() => handlePlaylistPress(item.id)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Image source={item.image} style={styles.thumb} />
          <View style={styles.copy}>
            <AppText style={styles.rowTitle}>{item.title}</AppText>
            <AppText muted style={styles.rowSub}>
              {item.subtitle}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      ))}

      <MiniPlayer bottomOffset={miniBottom} />
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
    ...StyleSheet.absoluteFill,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  moodTip: {
    backgroundColor: colors.surfaceSage,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  moodTipLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  moodTipBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 4,
  },
  moodTipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  moodTipBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.accentDeep,
  },
  sectionLabel: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  surpriseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  surpriseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  todayTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  todaySub: {
    fontSize: 12,
    lineHeight: 16,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
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
  pressed: { opacity: 0.94 },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
  },
  copy: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
