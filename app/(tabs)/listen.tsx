import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/AppText';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { PLAYLISTS } from '@/lib/content';
import { images } from '@/lib/images';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

export default function ListenScreen() {
  return (
    <Screen>
      <PageHeader
        title="Listen"
        subtitle="Find something that fits the moment."
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Today's Playlist. Coming soon."
        onPress={() =>
          Alert.alert("Today's Playlist", 'Music will connect in a later phase.')
        }
        style={({ pressed }) => [styles.featured, pressed && styles.pressed]}
      >
        <ImageBackground
          source={images.listen.playlist}
          style={styles.featuredBg}
          imageStyle={styles.featuredImage}
        >
          <LinearGradient
            colors={['rgba(74,59,52,0.15)', 'rgba(74,59,52,0.55)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.featuredCopy}>
            <AppText style={styles.featuredLabel}>TODAY</AppText>
            <AppText style={styles.featuredTitle}>{"Today's Playlist"}</AppText>
            <AppText style={styles.featuredSub}>
              Soft sounds for an easy evening
            </AppText>
          </View>
          <View style={styles.play}>
            <Ionicons name="play" size={18} color={colors.white} />
          </View>
        </ImageBackground>
      </Pressable>

      <AppText variant="label" style={styles.sectionLabel}>
        Mood Playlists
      </AppText>

      {PLAYLISTS.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.subtitle}`}
          onPress={() =>
            Alert.alert(item.title, 'Coming in a later phase.')
          }
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  featured: {
    marginBottom: spacing.xl,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.soft,
  },
  featuredBg: {
    minHeight: 160,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  featuredImage: {
    borderRadius: radii.xl,
  },
  featuredCopy: {
    maxWidth: '75%',
  },
  featuredLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,251,247,0.8)',
    marginBottom: 6,
  },
  featuredTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.white,
    marginBottom: 4,
  },
  featuredSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,251,247,0.9)',
  },
  play: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,251,247,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,251,247,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: colors.textMuted,
    marginBottom: spacing.md,
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
