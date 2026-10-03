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
import { Screen } from '@/components/Screen';
import { PLAYLISTS } from '@/lib/content';
import { appImages } from '@/lib/images';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

export default function ListenScreen() {
  return (
    <Screen>
      <View style={styles.heroWrap}>
        <ImageBackground
          source={appImages.listenHero}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel="Cozy bed and warm sunlight with headphones"
        >
          <LinearGradient
            colors={['rgba(74,59,52,0.0)', 'rgba(74,59,52,0.28)', 'rgba(74,59,52,0.68)']}
            style={styles.overlay}
          />
          <View style={styles.heroContent}>
            <AppText style={styles.heroLabel}>SANCTUARY</AppText>
            <AppText style={styles.heroTitle}>Listen</AppText>
            <AppText style={styles.heroSubtitle}>
              Find something that fits the moment.
            </AppText>
          </View>
        </ImageBackground>
      </View>

      <AppText variant="label" style={styles.sectionLabel}>
        Today’s Playlist
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Today's Playlist. Soft sounds for an easy evening."
        onPress={() =>
          Alert.alert("Today's Playlist", 'Music will connect in a later phase.')
        }
        style={({ pressed }) => [styles.todayCard, pressed && styles.pressed]}
      >
        <View style={styles.todayCopy}>
          <AppText style={styles.todayTitle}>Soft sounds for an easy evening</AppText>
          <AppText muted style={styles.todaySub}>
            Curated calm sounds for your current space
          </AppText>
        </View>
        <View style={styles.playBtn}>
          <Ionicons name="play" size={16} color={colors.white} />
        </View>
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
    ...StyleSheet.absoluteFill,
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
  sectionLabel: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  todayCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  todayTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  todaySub: {
    fontSize: 12,
    lineHeight: 16,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...shadows.soft,
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
