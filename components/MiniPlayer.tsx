import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { useMusicPlayer } from '@/lib/MusicPlayerProvider';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

type Props = {
  /** Extra bottom offset when sitting above the tab bar. */
  bottomOffset?: number;
};

export function MiniPlayer({ bottomOffset = 0 }: Props) {
  const router = useRouter();
  const { track, status, togglePlayPause, clear } = useMusicPlayer();

  if (!track) return null;

  const playing = status === 'playing' || status === 'loading';

  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View style={styles.card}>
        <Pressable
          onPress={() => router.push('/music/player')}
          style={({ pressed }) => [styles.mainHit, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Now playing ${track.title}`}
        >
          {track.albumImage ? (
            <Image source={{ uri: track.albumImage }} style={styles.art} />
          ) : (
            <View style={[styles.art, styles.artFallback]}>
              <Ionicons name="musical-notes-outline" size={16} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.copy}>
            <AppText style={styles.title} numberOfLines={1}>
              {track.title}
            </AppText>
            <AppText muted style={styles.artist} numberOfLines={1}>
              {track.artist}
            </AppText>
          </View>
        </Pressable>
        <Pressable
          onPress={() => {
            togglePlayPause().catch(() => {});
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityLabel={playing ? 'Pause' : 'Play'}
          disabled={!track.previewUrl}
        >
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={18}
            color={track.previewUrl ? colors.textPrimary : colors.textMuted}
          />
        </Pressable>
        <Pressable
          onPress={() => {
            clear().catch(() => {});
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityLabel="Close player"
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navigation,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  mainHit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  art: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceWarm,
  },
  artFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textPrimary,
  },
  artist: {
    fontSize: 11,
    marginTop: 1,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
});
