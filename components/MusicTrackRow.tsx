import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { MusicTrack } from '@/lib/types';

type Props = {
  track: MusicTrack;
  active?: boolean;
  playing?: boolean;
  onPress: () => void;
};

export function MusicTrackRow({ track, active, playing, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        active && styles.rowActive,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} by ${track.artist}`}
    >
      {track.albumImage ? (
        <Image source={{ uri: track.albumImage }} style={styles.art} />
      ) : (
        <View style={[styles.art, styles.artFallback]}>
          <Ionicons name="musical-notes-outline" size={18} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.copy}>
        <AppText style={styles.title} numberOfLines={1}>
          {track.title}
        </AppText>
        <AppText muted style={styles.artist} numberOfLines={1}>
          {track.artist}
        </AppText>
        {!track.previewUrl && (
          <AppText muted style={styles.previewHint}>
            Tap to listen
          </AppText>
        )}
      </View>
      <View style={[styles.playBtn, playing && styles.playBtnActive]}>
        <Ionicons
          name={playing ? 'pause' : 'play'}
          size={14}
          color={colors.white}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  },
  rowActive: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.borderStrong,
  },
  art: {
    width: 52,
    height: 52,
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
    fontSize: 15,
    color: colors.textPrimary,
  },
  artist: {
    fontSize: 12,
    marginTop: 2,
  },
  previewHint: {
    fontSize: 11,
    marginTop: 2,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: colors.accentDeep,
  },
  pressed: { opacity: 0.92 },
});
