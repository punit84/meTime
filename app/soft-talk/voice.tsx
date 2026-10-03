import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { MOODS } from '@/lib/moods';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { VoiceEntry } from '@/lib/types';

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function groupEntriesByDate(entries: VoiceEntry[]) {
  const today = new Date();
  const todayStr = today.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todayGroup: VoiceEntry[] = [];
  const yesterdayGroup: VoiceEntry[] = [];
  const earlierGroup: VoiceEntry[] = [];

  for (const entry of entries) {
    const entryDate = new Date(entry.createdAt);
    const entryDateStr = entryDate.toDateString();

    if (entryDateStr === todayStr) {
      todayGroup.push(entry);
    } else if (entryDateStr === yesterdayStr) {
      yesterdayGroup.push(entry);
    } else {
      earlierGroup.push(entry);
    }
  }

  const groups: { title: string; data: VoiceEntry[] }[] = [];
  if (todayGroup.length > 0) groups.push({ title: 'TODAY', data: todayGroup });
  if (yesterdayGroup.length > 0) groups.push({ title: 'YESTERDAY', data: yesterdayGroup });
  if (earlierGroup.length > 0) groups.push({ title: 'EARLIER', data: earlierGroup });

  return groups;
}

export default function MyVoiceScreen() {
  const router = useRouter();
  const { voiceEntries, removeVoiceEntry } = useApp();

  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosMs, setPlaybackPosMs] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);

  const groups = useMemo(() => groupEntriesByDate(voiceEntries), [voiceEntries]);
  const totalCount = voiceEntries.length;

  // Unload audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = async (entry: VoiceEntry) => {
    // If currently playing this entry, toggle pause/play
    if (activeSoundId === entry.id && soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    // Stop and unload previous sound if playing another item
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    setActiveSoundId(entry.id);
    setIsPlaying(false);
    setPlaybackPosMs(0);

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
            setIsPlaying(status.isPlaying);
            setPlaybackPosMs(status.positionMillis);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackPosMs(0);
              setActiveSoundId(null);
            }
          }
        },
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      if (__DEV__) console.warn('[MyVoice] Playback failed:', error);
      setActiveSoundId(null);
      setIsPlaying(false);
    }
  };

  const handleDelete = (entry: VoiceEntry) => {
    Alert.alert(
      'Delete this recording?',
      'This voice note will be removed from your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (activeSoundId === entry.id && soundRef.current) {
              try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
              } catch {}
              soundRef.current = null;
              setActiveSoundId(null);
              setIsPlaying(false);
            }
            await removeVoiceEntry(entry.id);
          },
        },
      ],
    );
  };

  return (
    <Screen>
      {/* Top Bar */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/soft-talk')}
          style={({ pressed }) => [styles.recordBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Record new voice note"
        >
          <Ionicons name="mic-outline" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <AppText style={styles.tag}>SANCTUARY AUDIO</AppText>
        <AppText style={styles.title}>My Voice</AppText>
        <AppText style={styles.subtitle}>
          {totalCount === 0
            ? 'Your thoughts, kept just for you.'
            : `${totalCount} private voice note${totalCount > 1 ? 's' : ''} saved.`}
        </AppText>
      </View>

      {/* Empty State */}
      {voiceEntries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="mic-outline"
            title="No voice notes yet."
            subtitle="Whenever you need to let something out, you can leave it here."
          />
          <Pressable
            onPress={() => router.push('/soft-talk')}
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Start Recording"
          >
            <Ionicons name="mic-outline" size={18} color={colors.white} />
            <AppText style={styles.ctaBtnText}>Start Recording</AppText>
          </Pressable>
        </View>
      ) : (
        /* Grouped Recordings List */
        <View style={styles.listContent}>
          {groups.map((group) => (
            <View key={group.title} style={styles.groupSection}>
              <AppText muted style={styles.groupHeader}>
                {group.title}
              </AppText>

              {group.data.map((entry) => {
                const isCurrentActive = activeSoundId === entry.id;
                const moodConfig = entry.mood
                  ? MOODS.find((m) => m.id === entry.mood)
                  : null;

                const timeStr = new Date(entry.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <View key={entry.id} style={styles.voiceCard}>
                    {/* Play / Pause Circular Button */}
                    <Pressable
                      onPress={() => handleTogglePlay(entry)}
                      style={({ pressed }) => [
                        styles.playBtn,
                        isCurrentActive && isPlaying && styles.playBtnActive,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isCurrentActive && isPlaying ? 'Pause voice note' : 'Play voice note'
                      }
                    >
                      <Ionicons
                        name={isCurrentActive && isPlaying ? 'pause' : 'play'}
                        size={16}
                        color={isCurrentActive && isPlaying ? colors.white : colors.textPrimary}
                      />
                    </Pressable>

                    {/* Audio Info */}
                    <View style={styles.voiceInfo}>
                      <View style={styles.voiceTopRow}>
                        <AppText style={styles.durationText}>
                          {isCurrentActive && isPlaying
                            ? `${formatDuration(playbackPosMs)} / ${formatDuration(entry.durationMs)}`
                            : formatDuration(entry.durationMs)}
                        </AppText>

                        {moodConfig && (
                          <View
                            style={[
                              styles.moodTag,
                              { backgroundColor: moodConfig.wash },
                            ]}
                          >
                            <Ionicons
                              name={moodConfig.icon}
                              size={11}
                              color={moodConfig.accent}
                            />
                            <AppText
                              style={[styles.moodTagText, { color: moodConfig.accent }]}
                            >
                              {moodConfig.title}
                            </AppText>
                          </View>
                        )}
                      </View>

                      <AppText muted style={styles.timeText}>
                        {timeStr}
                      </AppText>
                    </View>

                    {/* Delete Action Button */}
                    <Pressable
                      onPress={() => handleDelete(entry)}
                      style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Delete voice note"
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: {
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
  recordBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  tag: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 36,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.selected,
    paddingHorizontal: spacing.xl,
    height: 48,
    borderRadius: radii.md,
    marginTop: spacing.md,
    ...shadows.soft,
  },
  ctaBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.white,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  groupSection: {
    marginBottom: spacing.lg,
  },
  groupHeader: {
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginRight: spacing.md,
  },
  playBtnActive: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  durationText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
  },
  moodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  moodTagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
  timeText: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
