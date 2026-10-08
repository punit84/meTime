import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { useApp } from '@/lib/AppProvider';
import { MOODS } from '@/lib/moods';
import { colors, fonts, radii, spacing } from '@/lib/theme';

export default function MirrorViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { mirrorEntries, removeMirrorEntry } = useApp();

  const [deleting, setDeleting] = useState(false);

  const entry = mirrorEntries.find((e) => e.id === params.id);

  if (!entry) {
    return (
      <View style={[styles.container, styles.notFoundWrap]}>
        <StatusBar style="light" />
        <AppText style={styles.notFoundTitle}>Memory Not Found</AppText>
        <AppText style={styles.notFoundSub}>
          This memory may have already been removed.
        </AppText>
        <Pressable
          onPress={() => router.back()}
          style={styles.notFoundBtn}
        >
          <AppText style={styles.notFoundBtnText}>Return to Gallery</AppText>
        </Pressable>
      </View>
    );
  }

  const moodConfig = entry.mood ? MOODS.find((m) => m.id === entry.mood) : null;
  const createdDate = new Date(entry.createdAt);
  const formattedDate = createdDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = createdDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = () => {
    const performDelete = async () => {
      setDeleting(true);
      try {
        await removeMirrorEntry(entry.id);
        router.back();
      } catch (error) {
        if (__DEV__) console.warn('[Mirror Viewer] Delete failed:', error);
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Delete this memory? This cannot be undone.')) {
        performDelete().catch(() => {});
      }
    } else {
      Alert.alert(
        'Delete this memory?',
        'This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              performDelete().catch(() => {});
            },
          },
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Media Player / Image */}
      <View style={styles.mediaContainer}>
        {entry.type === 'photo' ? (
          <Image
            source={{ uri: entry.uri }}
            style={styles.media}
            resizeMode="contain"
          />
        ) : (
          <Video
            source={{ uri: entry.uri }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            isLooping
          />
        )}
      </View>

      {/* Floating Top Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Close viewer"
        >
          <Ionicons name="close" size={22} color={colors.white} />
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          style={({ pressed }) => [styles.glassBtn, styles.deleteBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Delete memory"
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </Pressable>
      </View>

      {/* Floating Bottom Bar with Date and Mood info */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
        <View style={styles.infoRow}>
          <View>
            <AppText style={styles.dateText}>{formattedDate}</AppText>
            <AppText muted style={styles.timeText}>{formattedTime}</AppText>
          </View>

          {moodConfig && (
            <View style={[styles.moodPill, { backgroundColor: moodConfig.wash }]}>
              <Ionicons name={moodConfig.icon} size={14} color={moodConfig.accent} />
              <AppText style={[styles.moodText, { color: moodConfig.accent }]}>
                {moodConfig.title}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12100E',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 20,
  },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(30, 24, 22, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: 'rgba(60, 20, 20, 0.7)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(18, 16, 14, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.white,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  moodText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  notFoundWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  notFoundTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  notFoundSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: spacing.lg,
  },
  notFoundBtn: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  notFoundBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
