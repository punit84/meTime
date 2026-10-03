import { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { MOODS } from '@/lib/moods';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { MirrorEntry } from '@/lib/types';

function groupEntriesByDate(entries: MirrorEntry[]) {
  const today = new Date();
  const todayStr = today.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todayGroup: MirrorEntry[] = [];
  const yesterdayGroup: MirrorEntry[] = [];
  const earlierGroup: MirrorEntry[] = [];

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

  const groups: { title: string; data: MirrorEntry[] }[] = [];
  if (todayGroup.length > 0) groups.push({ title: 'TODAY', data: todayGroup });
  if (yesterdayGroup.length > 0) groups.push({ title: 'YESTERDAY', data: yesterdayGroup });
  if (earlierGroup.length > 0) groups.push({ title: 'EARLIER', data: earlierGroup });

  return groups;
}

export default function MyMirrorGalleryScreen() {
  const router = useRouter();
  const { mirrorEntries } = useApp();

  const groups = useMemo(() => groupEntriesByDate(mirrorEntries), [mirrorEntries]);

  const totalCount = mirrorEntries.length;

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
          onPress={() => router.push({ pathname: '/mirror/camera', params: { mode: 'photo' } })}
          style={({ pressed }) => [styles.cameraBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Take new photo or video"
        >
          <Ionicons name="camera-outline" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Page Title & Subtitle */}
      <View style={styles.titleSection}>
        <AppText style={styles.tag}>SANCTUARY REFLECTIONS</AppText>
        <AppText style={styles.title}>My Mirror</AppText>
        <AppText style={styles.subtitle}>
          {totalCount === 0
            ? 'Moments you’ve saved with yourself.'
            : `${totalCount} saved moment${totalCount > 1 ? 's' : ''} in your private space.`}
        </AppText>
      </View>

      {/* Empty State */}
      {mirrorEntries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="eye-outline"
            title="Your private moments will live here."
            subtitle="Take a photo or record a little moment whenever you feel like it."
          />
          <Pressable
            onPress={() => router.push({ pathname: '/mirror/camera', params: { mode: 'photo' } })}
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Take a Photo"
          >
            <Ionicons name="camera-outline" size={18} color={colors.white} />
            <AppText style={styles.ctaBtnText}>Take a Photo</AppText>
          </Pressable>
        </View>
      ) : (
        /* Grouped Gallery */
        <View style={styles.galleryContent}>
          {groups.map((group) => (
            <View key={group.title} style={styles.groupSection}>
              <AppText muted style={styles.groupHeader}>
                {group.title}
              </AppText>

              <View style={styles.grid}>
                {group.data.map((item) => {
                  const moodConfig = item.mood
                    ? MOODS.find((m) => m.id === item.mood)
                    : null;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        router.push({
                          pathname: '/mirror/viewer',
                          params: { id: item.id },
                        })
                      }
                      style={({ pressed }) => [
                        styles.gridItem,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.type === 'photo' ? 'Photo' : 'Video'} memory saved ${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />

                      {/* Video Play Overlay */}
                      {item.type === 'video' && (
                        <View style={styles.videoBadge}>
                          <Ionicons name="play" size={14} color={colors.white} />
                        </View>
                      )}

                      {/* Mood Indicator Badge */}
                      {moodConfig && (
                        <View
                          style={[
                            styles.moodBadge,
                            { backgroundColor: moodConfig.wash },
                          ]}
                        >
                          <Ionicons
                            name={moodConfig.icon}
                            size={12}
                            color={moodConfig.accent}
                          />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
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
  cameraBtn: {
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
  galleryContent: {
    paddingBottom: spacing.xxl,
  },
  groupSection: {
    marginBottom: spacing.xl,
  },
  groupHeader: {
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '48.5%',
    aspectRatio: 3 / 4,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...shadows.soft,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  moodBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
