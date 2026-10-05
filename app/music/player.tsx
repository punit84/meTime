import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { formatTrackDuration } from '@/lib/music';
import { useMusicPlayer } from '@/lib/MusicPlayerProvider';
import { getSpotifyEmbedUrl, getSpotifyOpenUrl } from '@/lib/spotify';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

export default function MusicPlayerScreen() {
  const router = useRouter();
  const {
    track,
    status,
    positionMs,
    durationMs,
    errorMessage,
    togglePlayPause,
    clear,
  } = useMusicPlayer();

  if (!track) {
    return (
      <Screen>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="title" style={{ marginTop: spacing.lg }}>
          Nothing playing
        </AppText>
        <AppText muted style={{ marginTop: spacing.sm }}>
          Choose a song from Listen when you’re ready.
        </AppText>
      </Screen>
    );
  }

  const playing = status === 'playing' || status === 'loading';
  const progress =
    durationMs > 0 ? Math.min(1, Math.max(0, positionMs / durationMs)) : 0;
  const canPreview = !!track.previewUrl;
  const embedUrl = getSpotifyEmbedUrl(track.id);
  const openUrl = getSpotifyOpenUrl(track);

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={() => {
            clear().catch(() => {});
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityLabel="Close player"
        >
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.center}>
        {track.albumImage ? (
          <Image source={{ uri: track.albumImage }} style={styles.art} />
        ) : (
          <View style={[styles.art, styles.artFallback]}>
            <Ionicons name="musical-notes-outline" size={42} color={colors.textMuted} />
          </View>
        )}

        <AppText style={styles.title}>{track.title}</AppText>
        <AppText muted style={styles.artist}>
          {track.artist}
        </AppText>

        {canPreview ? (
          <>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <AppText muted style={styles.time}>
                {formatTrackDuration(positionMs)}
              </AppText>
              <AppText muted style={styles.time}>
                {formatTrackDuration(durationMs || track.durationMs)}
              </AppText>
            </View>

            {!!errorMessage && (
              <AppText muted style={styles.previewNote}>
                {errorMessage}
              </AppText>
            )}

            <View style={styles.controls}>
              <Pressable
                onPress={() => {
                  togglePlayPause().catch(() => {});
                }}
                style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
                accessibilityLabel={playing ? 'Pause' : 'Play'}
              >
                <Ionicons
                  name={playing ? 'pause' : 'play'}
                  size={28}
                  color={colors.white}
                />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.embedBlock}>
            <AppText muted style={styles.embedHint}>
              Spotify previews aren’t available for this song. Use the player below to listen.
            </AppText>
            <View style={styles.embedShell}>
              <WebView
                source={{ uri: embedUrl }}
                style={styles.embed}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                accessibilityLabel="Spotify player"
              />
            </View>
          </View>
        )}

        <Pressable
          onPress={() => {
            Linking.openURL(openUrl).catch(() => {});
          }}
          style={({ pressed }) => [styles.openBtn, pressed && styles.pressed]}
        >
          <Ionicons name="open-outline" size={16} color={colors.accentDeep} />
          <AppText style={styles.openText}>Open in Spotify</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  art: {
    width: 220,
    height: 220,
    maxWidth: '80%',
    aspectRatio: 1,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceWarm,
    marginBottom: spacing.xl,
    ...shadows.soft,
  },
  artFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  artist: {
    marginTop: spacing.sm,
    fontSize: 15,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    maxWidth: 320,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceWarm,
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  timeRow: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  time: {
    fontSize: 11,
  },
  previewNote: {
    marginTop: spacing.md,
    fontSize: 13,
  },
  controls: {
    marginTop: spacing.xl,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  embedBlock: {
    width: '100%',
    marginTop: spacing.xl,
  },
  embedHint: {
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  embedShell: {
    width: '100%',
    height: 152,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  embed: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSage,
    borderWidth: 1,
    borderColor: colors.border,
  },
  openText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.accentDeep,
  },
  pressed: { opacity: 0.9 },
});
