import { useEffect, useState } from 'react';
import { Animated, ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/AppText';
import { appImages } from '@/lib/images';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

type Props = {
  brand?: string;
  name?: string;
  support?: string;
};

export function HomeHero({
  brand = 'ME TIME',
  name,
  support = 'Take a little moment for yourself.',
}: Props) {
  const [fade] = useState(() => new Animated.Value(0));
  const [rise] = useState(() => new Animated.Value(12));
  const timeGreeting = greetingForHour(new Date().getHours());
  const greeting = name ? `${timeGreeting}, ${name} ♡` : `${timeGreeting}, ♡`;

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
        source={appImages.homeHero}
        style={styles.hero}
        imageStyle={styles.heroImage}
        resizeMode="cover"
        accessibilityRole="image"
        accessibilityLabel="Warm sunlight through window with cozy interior"
      >
        <LinearGradient
          colors={['rgba(74,59,52,0.0)', 'rgba(74,59,52,0.28)', 'rgba(74,59,52,0.68)']}
          style={styles.overlay}
        />
        <View style={styles.content}>
          <AppText style={styles.brand}>{brand}</AppText>
          <AppText style={styles.greeting}>{greeting}</AppText>
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
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    zIndex: 2,
  },
  brand: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255,251,247,0.92)',
    marginBottom: 2,
  },
  greeting: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 30,
    color: colors.white,
    marginBottom: 2,
  },
  support: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,251,247,0.92)',
    maxWidth: 240,
  },
});
