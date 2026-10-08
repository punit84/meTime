import { useMemo } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { MoodType } from '@/lib/types';

const MOOD_META: Record<MoodType, { label: string; icon: string; bg: string }> = {
  glow: { label: 'Glow', icon: 'sparkles-outline', bg: colors.surfacePeach },
  happy: { label: 'Happy', icon: 'sunny-outline', bg: colors.surfaceWarm },
  calm: { label: 'Calm', icon: 'leaf-outline', bg: colors.surfaceSage },
  uneasy: { label: 'Uneasy', icon: 'cloudy-outline', bg: colors.surfaceLavender },
  sad: { label: 'Sad', icon: 'rainy-outline', bg: colors.surfaceRose },
};

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function JournalEntryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { journalEntries, journalPhotos, deleteJournalEntry } = useApp();

  const entry = journalEntries.find((e) => e.id === id);

  const attachedPhotos = useMemo(() => {
    if (entry?.photos && entry.photos.length > 0) return entry.photos;
    if (!entry) return [];
    return journalPhotos.filter(
      (p) => (entry.photoIds && entry.photoIds.includes(p.id)) || p.entryId === entry.id,
    );
  }, [entry, journalPhotos]);

  const handleDelete = () => {
    const performDelete = async () => {
      if (!id) return;
      await deleteJournalEntry(id);
      router.replace('/write/entries');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this journal page? This cannot be undone.')) {
        performDelete().catch(() => {});
      }
    } else {
      Alert.alert(
        'Delete Journal Page',
        'Are you sure you want to delete this page and any attached photos? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => performDelete() },
        ],
      );
    }
  };

  if (!entry) {
    return (
      <Screen>
        <View style={styles.notFoundWrap}>
          <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          <AppText style={styles.notFoundTitle}>Page Not Found</AppText>
          <AppText muted style={styles.notFoundSubtitle}>
            This journal page may have been deleted or moved.
          </AppText>
          <Pressable
            onPress={() => router.replace('/write/entries')}
            style={({ pressed }) => [styles.backToListBtn, pressed && styles.pressed]}
          >
            <AppText style={styles.backToListText}>Return to My Entries</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const moodMeta = entry.mood ? MOOD_META[entry.mood] : null;
  const hasPhotos = attachedPhotos.length > 0;

  return (
    <Screen padded={false} edges={['left', 'right']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.topActions}>
          <Pressable
            onPress={() => router.push({ pathname: '/write/new', params: { id: entry.id } })}
            style={({ pressed }) => [styles.glassBtn, styles.actionBtnMargin, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Edit page"
          >
            <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.glassBtn, styles.deleteBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Delete page"
          >
            <Ionicons name="trash-outline" size={18} color="#D9534F" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
      >
        {/* Date & Time Header */}
        <View style={styles.metaRow}>
          <AppText muted style={styles.dateText}>
            {formatDate(entry.createdAt)} • {formatTime(entry.createdAt)}
          </AppText>

          {moodMeta && (
            <View style={[styles.moodBadge, { backgroundColor: moodMeta.bg }]}>
              <Ionicons name={moodMeta.icon as unknown as never} size={12} color={colors.textPrimary} />
              <AppText style={styles.moodBadgeText}>{moodMeta.label}</AppText>
            </View>
          )}
        </View>

        {/* Title */}
        {entry.title ? (
          <AppText style={styles.entryTitle}>{entry.title}</AppText>
        ) : null}

        {/* Body Text */}
        {entry.content ? (
          <AppText style={styles.entryBody}>{entry.content}</AppText>
        ) : null}

        {/* Attached Photos Vertical Gallery */}
        {hasPhotos && (
          <View style={styles.photosSection}>
            <View style={styles.photosHeader}>
              <Ionicons name="image-outline" size={16} color={colors.accentDeep} />
              <AppText style={styles.photosHeading}>
                Photos ({attachedPhotos.length})
              </AppText>
            </View>

            {attachedPhotos.map((photo, index) => (
              <View key={photo.id || `${photo.uri}-${index}`} style={styles.photoCard}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                {photo.caption ? (
                  <View style={styles.photoCaptionWrap}>
                    <AppText style={styles.photoCaption}>{photo.caption}</AppText>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnMargin: {
    marginRight: spacing.sm,
  },
  deleteBtn: {
    backgroundColor: 'rgba(217, 83, 79, 0.08)',
    borderColor: 'rgba(217, 83, 79, 0.25)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dateText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  moodBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textPrimary,
  },
  entryTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  entryBody: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 28,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  photosSection: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  photosHeading: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.accentDeep,
  },
  photoCard: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  photoImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  photoCaptionWrap: {
    padding: spacing.md,
    backgroundColor: colors.surfaceWarm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  photoCaption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notFoundTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  notFoundSubtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backToListBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.selected,
  },
  backToListText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
