import { useEffect, useRef, useState } from 'react';
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
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { MOODS } from '@/lib/moods';
import { appImages } from '@/lib/images';
import { periodProgress } from '@/lib/skinCare';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { VoiceEntry } from '@/lib/types';

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Sections that belong to later phases — show empty states. */
const OTHER_SPACE_SECTIONS = [
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
  const {
    todayMood,
    mirrorEntries,
    voiceEntries,
    skinCareRoutine,
    skinCareToday,
    recentlyPlayed,
    journalEntries,
    privateNotes,
  } = useApp();

  // Audio preview playback in My Space
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const handleToggleVoicePlay = async (entry: VoiceEntry) => {
    if (playingVoiceId === entry.id && soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlayingVoiceId(null);
      return;
    }

    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: entry.uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setPlayingVoiceId(null);
            }
          }
        },
      );
      soundRef.current = sound;
      setPlayingVoiceId(entry.id);
    } catch (error) {
      if (__DEV__) console.warn('[MySpace] Voice play failed:', error);
      setPlayingVoiceId(null);
    }
  };

  // Find the mood config for today's mood
  const moodConfig = todayMood
    ? MOODS.find((m) => m.id === todayMood.mood)
    : null;

  const mirrorCount = mirrorEntries.length;
  const voiceCount = voiceEntries.length;

  const skinConfigured =
    skinCareRoutine.configured && skinCareRoutine.steps.length > 0;
  const skinMorning = periodProgress(
    skinCareRoutine.steps,
    skinCareToday.completedStepIds,
    'morning',
  );
  const skinEvening = periodProgress(
    skinCareRoutine.steps,
    skinCareToday.completedStepIds,
    'evening',
  );

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

      {/* 1. My Mirror Section Card */}
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

      {/* 2. Soft Talk / My Voice Section Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: colors.surfacePeach }]}>
            <Ionicons name="mic-outline" size={16} color={colors.icon} />
          </View>
          <View style={styles.sectionTitleWrap}>
            <AppText style={styles.sectionTitle}>Soft Talk</AppText>
            {voiceCount > 0 && (
              <AppText muted style={styles.sectionMeta}>
                {voiceCount} recording{voiceCount > 1 ? 's' : ''}
              </AppText>
            )}
          </View>
          {voiceCount > 0 && (
            <Pressable
              onPress={() => router.push('/soft-talk/voice')}
              style={({ pressed }) => [styles.viewAllBtn, pressed && styles.pressed]}
            >
              <AppText style={styles.viewAllText}>View all</AppText>
              <Ionicons name="chevron-forward" size={13} color={colors.accentDeep} />
            </Pressable>
          )}
        </View>

        {voiceCount === 0 ? (
          <View style={styles.voiceEmptyWrap}>
            <EmptyState
              icon="mic-outline"
              title="No voice notes yet."
              subtitle="Whenever you need to let something out, you can leave it here."
            />
            <Pressable
              onPress={() => router.push('/soft-talk')}
              style={({ pressed }) => [styles.voiceEmptyBtn, pressed && styles.pressed]}
            >
              <Ionicons name="mic-outline" size={15} color={colors.textPrimary} />
              <AppText style={styles.voiceEmptyBtnText}>Start a Soft Talk</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.voiceList}>
            {voiceEntries.slice(0, 3).map((entry) => {
              const isPlaying = playingVoiceId === entry.id;
              const moodConfig = entry.mood
                ? MOODS.find((m) => m.id === entry.mood)
                : null;

              const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <View key={entry.id} style={styles.voicePreviewRow}>
                  <Pressable
                    onPress={() => handleToggleVoicePlay(entry)}
                    style={({ pressed }) => [
                      styles.voicePlayBtn,
                      isPlaying && styles.voicePlayBtnActive,
                      pressed && styles.pressed,
                    ]}
                    accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={13}
                      color={isPlaying ? colors.white : colors.textPrimary}
                    />
                  </Pressable>

                  <View style={styles.voicePreviewInfo}>
                    <AppText style={styles.voicePreviewDuration}>
                      {formatDuration(entry.durationMs)}
                    </AppText>
                    <AppText muted style={styles.voicePreviewDate}>
                      {dateStr}
                    </AppText>
                  </View>

                  {moodConfig && (
                    <View
                      style={[
                        styles.voiceMoodBadge,
                        { backgroundColor: moodConfig.wash },
                      ]}
                    >
                      <Ionicons
                        name={moodConfig.icon}
                        size={11}
                        color={moodConfig.accent}
                      />
                      <AppText
                        style={[styles.voiceMoodText, { color: moodConfig.accent }]}
                      >
                        {moodConfig.title}
                      </AppText>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 3. Write / My Journal Section Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: colors.surfaceWarm }]}>
            <Ionicons name="book-outline" size={16} color={colors.icon} />
          </View>
          <View style={styles.sectionTitleWrap}>
            <AppText style={styles.sectionTitle}>Write</AppText>
            {(journalEntries.length > 0 || privateNotes.length > 0) && (
              <AppText muted style={styles.sectionMeta}>
                {journalEntries.length} {journalEntries.length === 1 ? 'page' : 'pages'}
                {privateNotes.length > 0
                  ? ` • ${privateNotes.length} private note${privateNotes.length === 1 ? '' : 's'}`
                  : ''}
              </AppText>
            )}
          </View>
          {journalEntries.length > 0 && (
            <Pressable
              onPress={() => router.push('/write/entries')}
              style={({ pressed }) => [styles.viewAllBtn, pressed && styles.pressed]}
            >
              <AppText style={styles.viewAllText}>View all</AppText>
              <Ionicons name="chevron-forward" size={13} color={colors.accentDeep} />
            </Pressable>
          )}
        </View>

        {journalEntries.length === 0 && privateNotes.length === 0 ? (
          <View style={styles.voiceEmptyWrap}>
            <EmptyState
              icon="book-outline"
              title="Your words, kept close."
              subtitle="Private pages, poems, and handwritten thoughts."
            />
            <Pressable
              onPress={() => router.push('/write')}
              style={({ pressed }) => [styles.voiceEmptyBtn, pressed && styles.pressed]}
            >
              <Ionicons name="create-outline" size={15} color={colors.textPrimary} />
              <AppText style={styles.voiceEmptyBtnText}>Open Write</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.voiceList}>
            {journalEntries.slice(0, 3).map((entry) => {
              const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push({ pathname: '/write/entry/[id]', params: { id: entry.id } })}
                  style={({ pressed }) => [styles.voicePreviewRow, pressed && styles.pressed]}
                >
                  <View style={styles.writeRowIcon}>
                    <Ionicons
                      name={entry.photos && entry.photos.length > 0 ? 'image-outline' : 'document-text-outline'}
                      size={15}
                      color={colors.accentDeep}
                    />
                  </View>
                  <View style={styles.voicePreviewInfo}>
                    <AppText style={styles.voicePreviewDuration} numberOfLines={1}>
                      {entry.title || entry.content.slice(0, 35) || 'Untitled Page'}
                    </AppText>
                    <AppText muted style={styles.voicePreviewDate}>
                      {dateStr}
                      {entry.photos && entry.photos.length > 0
                        ? ` • ${entry.photos.length} photo${entry.photos.length > 1 ? 's' : ''}`
                        : ''}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* 4. Listen — recently played (lightweight) */}
      {recentlyPlayed.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.surfaceCool }]}>
              <Ionicons name="musical-notes-outline" size={16} color={colors.icon} />
            </View>
            <View style={styles.sectionTitleWrap}>
              <AppText style={styles.sectionTitle}>Listen</AppText>
              <AppText muted style={styles.sectionMeta}>
                Recently played
              </AppText>
            </View>
            <Pressable
              onPress={() => router.push('/listen')}
              style={({ pressed }) => [styles.viewAllBtn, pressed && styles.pressed]}
            >
              <AppText style={styles.viewAllText}>Open</AppText>
              <Ionicons name="chevron-forward" size={13} color={colors.accentDeep} />
            </Pressable>
          </View>
          <View style={styles.voiceList}>
            {recentlyPlayed.slice(0, 3).map((item) => (
              <View key={`${item.id}-${item.playedAt}`} style={styles.voicePreviewRow}>
                {item.albumImage ? (
                  <Image source={{ uri: item.albumImage }} style={styles.listenThumb} />
                ) : (
                  <View style={[styles.listenThumb, styles.listenThumbFallback]}>
                    <Ionicons name="musical-notes-outline" size={14} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.voicePreviewInfo}>
                  <AppText style={styles.voicePreviewDuration} numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText muted style={styles.voicePreviewDate} numberOfLines={1}>
                    {item.artist}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 4. Skin Care Section Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: colors.surfaceSage }]}>
            <Ionicons name="sparkles-outline" size={16} color={colors.icon} />
          </View>
          <View style={styles.sectionTitleWrap}>
            <AppText style={styles.sectionTitle}>Skin Care</AppText>
            {skinConfigured && (
              <AppText muted style={styles.sectionMeta}>
                A little care, every day
              </AppText>
            )}
          </View>
        </View>

        {!skinConfigured ? (
          <View style={styles.voiceEmptyWrap}>
            <EmptyState
              icon="sparkles-outline"
              title="Create your first routine."
              subtitle="A soft morning and evening ritual, kept only on this device."
            />
            <Pressable
              onPress={() => router.push('/skin-care')}
              style={({ pressed }) => [styles.voiceEmptyBtn, pressed && styles.pressed]}
            >
              <Ionicons name="sparkles-outline" size={15} color={colors.textPrimary} />
              <AppText style={styles.voiceEmptyBtnText}>Set up routine</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.skinCareBody}>
            <View style={styles.skinCareRow}>
              <AppText style={styles.skinCarePeriod}>Morning</AppText>
              <AppText muted style={styles.skinCareCount}>
                {skinMorning.total === 0
                  ? '—'
                  : `${skinMorning.completed}/${skinMorning.total} complete${
                      skinMorning.done ? ' ✓' : ''
                    }`}
              </AppText>
            </View>
            <View style={styles.skinCareRow}>
              <AppText style={styles.skinCarePeriod}>Evening</AppText>
              <AppText muted style={styles.skinCareCount}>
                {skinEvening.total === 0
                  ? '—'
                  : `${skinEvening.completed}/${skinEvening.total} complete${
                      skinEvening.done ? ' ✓' : ''
                    }`}
              </AppText>
            </View>
            <Pressable
              onPress={() => router.push('/skin-care')}
              style={({ pressed }) => [styles.skinCareLink, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="View skin care routine"
            >
              <AppText style={styles.viewAllText}>View routine</AppText>
              <Ionicons name="chevron-forward" size={13} color={colors.accentDeep} />
            </Pressable>
          </View>
        )}
      </View>

      {/* 5. Other Space sections with empty states */}
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
    paddingBottom: 4,
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
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewAllText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.accentDeep,
  },

  // Mirror strip
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

  // Voice list in My Space
  voiceList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  voicePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  voicePlayBtnActive: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  voicePreviewInfo: {
    flex: 1,
  },
  voicePreviewDuration: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textPrimary,
  },
  voicePreviewDate: {
    fontSize: 11,
    marginTop: 1,
  },
  voiceMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  voiceMoodText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
  voiceEmptyWrap: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  voiceEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginTop: -spacing.sm,
    marginBottom: spacing.xs,
  },
  voiceEmptyBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  skinCareBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  skinCareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceWarm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  skinCarePeriod: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.textPrimary,
  },
  skinCareCount: {
    fontSize: 12,
  },
  skinCareLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 2,
    paddingTop: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  listenThumb: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  listenThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
});
