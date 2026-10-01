import { useEffect, useRef } from 'react';
import { Animated, ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/AppText';
import { images } from '@/lib/images';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

type Props = {
  brand?: string;
  support?: string;
};

export function HomeHero({
  brand = 'ME TIME',
  support = 'Take a little moment for yourself.',
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;
  const greeting = greetingForHour(new Date().getHours());

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        { opacity: fade, transform: [{ translateY: rise }] },
      ]}
    >
      <ImageBackground
        source={images.home.hero}
        style={styles.hero}
        imageStyle={styles.heroImage}
        accessibilityRole="image"
        accessibilityLabel="Warm cozy interior with soft evening light"
      >
        <LinearGradient
          colors={['rgba(74,59,52,0.08)', 'rgba(74,59,52,0.42)']}
          style={styles.overlay}
        />
        <View style={styles.content}>
          <AppText style={styles.brand}>{brand}</AppText>
          <AppText style={styles.greeting}>
            {greeting}, ♡
          </AppText>
          <AppText style={styles.support}>{support}</AppText>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.section,
    ...shadows.soft,
  },
  hero: {
    minHeight: 220,
    borderRadius: radii.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: radii.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xxl,
    zIndex: 2,
  },
  brand: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 2.4,
    color: 'rgba(255,251,247,0.88)',
    marginBottom: spacing.sm,
  },
  greeting: {
    fontFamily: fonts.displayBold,
    fontSize: 36,
    lineHeight: 40,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  support: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,251,247,0.9)',
    maxWidth: 240,
  },
});
