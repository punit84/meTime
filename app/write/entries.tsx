import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { JournalEntry, MoodType } from '@/lib/types';

const MOOD_META: Record<MoodType, { label: string; bg: string }> = {
  glow: { label: 'Glow', bg: colors.surfacePeach },
  happy: { label: 'Happy', bg: colors.surfaceWarm },
  calm: { label: 'Calm', bg: colors.surfaceSage },
  uneasy: { label: 'Uneasy', bg: colors.surfaceLavender },
  sad: { label: 'Sad', bg: colors.surfaceRose },
};

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupEntriesByDate(entries: JournalEntry[]): { title: string; items: JournalEntry[] }[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todayItems: JournalEntry[] = [];
  const yesterdayItems: JournalEntry[] = [];
  const earlierItems: JournalEntry[] = [];

  entries.forEach((item) => {
    const itemDate = new Date(item.createdAt).toDateString();
    if (itemDate === todayStr) {
      todayItems.push(item);
    } else if (itemDate === yesterdayStr) {
      yesterdayItems.push(item);
    } else {
      earlierItems.push(item);
    }
  });

  const sections: { title: string; items: JournalEntry[] }[] = [];
  if (todayItems.length > 0) sections.push({ title: 'TODAY', items: todayItems });
  if (yesterdayItems.length > 0) sections.push({ title: 'YESTERDAY', items: yesterdayItems });
  if (earlierItems.length > 0) sections.push({ title: 'EARLIER', items: earlierItems });

  return sections;
}

export default function MyEntriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries } = useApp();

  const groupedSections = useMemo(() => {
    return groupEntriesByDate(journalEntries);
  }, [journalEntries]);

  return (
    <Screen padded={false} edges={['left', 'right']}>
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.tagBadge}>
          <AppText style={styles.tagText}>MY ENTRIES</AppText>
        </View>

        <Pressable
          onPress={() => router.push('/write/new')}
          style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="New Journal Entry"
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <AppText style={styles.newBtnText}>Write</AppText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 32 },
        ]}
      >
        {/* Title & Stats */}
        <View style={styles.headerSection}>
          <AppText style={styles.title}>Journal Pages</AppText>
          <AppText muted style={styles.subtitle}>
            {journalEntries.length} {journalEntries.length === 1 ? 'page' : 'pages'} written for yourself.
          </AppText>
        </View>

        {/* ─── UNIFIED JOURNAL PAGES LIST ─── */}
        <View>
          {journalEntries.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No pages yet."
              message="Whenever you have something to say, there's a quiet place waiting for you."
              actionLabel="Start Writing"
              onAction={() => router.push('/write/new')}
            />
          ) : (
            groupedSections.map((section) => (
              <View key={section.title} style={styles.sectionWrap}>
                <AppText muted style={styles.sectionHeader}>
                  {section.title}
                </AppText>

                {section.items.map((entry) => {
                  const hasPhotos = entry.photos && entry.photos.length > 0;
                  const moodMeta = entry.mood ? MOOD_META[entry.mood] : null;

                  return (
                    <Pressable
                      key={entry.id}
                      onPress={() => router.push({ pathname: '/write/entry/[id]', params: { id: entry.id } })}
                      style={({ pressed }) => [
                        styles.entryCard,
                        pressed && styles.entryCardPressed,
                      ]}
                    >
                      <View style={styles.entryHeaderRow}>
                        <AppText style={styles.entryTitle} numberOfLines={1}>
                          {entry.title || 'Untitled Page'}
                        </AppText>
                        <AppText muted style={styles.entryTime}>
                          {formatTime(entry.createdAt)}
                        </AppText>
                      </View>

                      <AppText muted style={styles.entrySnippet} numberOfLines={2}>
                        {entry.content || (hasPhotos ? 'Keepsake photo attached' : '')}
                      </AppText>

                      {/* Badges Row: Mood & Photo counter */}
                      <View style={styles.badgesRow}>
                        {moodMeta && (
                          <View style={[styles.moodBadge, { backgroundColor: moodMeta.bg }]}>
                            <AppText style={styles.moodBadgeText}>{moodMeta.label}</AppText>
                          </View>
                        )}

                        {hasPhotos && (
                          <View style={styles.photoBadge}>
                            <Ionicons name="image-outline" size={13} color={colors.accentDeep} />
                            <AppText style={styles.photoBadgeText}>
                              {entry.photos?.length} {entry.photos?.length === 1 ? 'photo' : 'photos'}
                            </AppText>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  glassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.selected,
    ...shadows.soft,
  },
  newBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerSection: {
    marginBottom: spacing.xl,
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
  },
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    color: colors.textMuted,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  entryCardPressed: {
    backgroundColor: colors.surfaceWarm,
    transform: [{ scale: 0.99 }],
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  entryTime: {
    fontFamily: fonts.body,
    fontSize: 11,
  },
  entrySnippet: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  moodBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  moodBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textPrimary,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.accentDeep,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
