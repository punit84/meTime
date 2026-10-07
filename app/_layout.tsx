import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  useFonts as useCormorant,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  useFonts as useOutfit,
} from '@expo-google-fonts/outfit';
import { AppText } from '@/components/AppText';
import { AppProvider, useApp } from '@/lib/AppProvider';
import { MusicPlayerProvider } from '@/lib/MusicPlayerProvider';
import { colors, fonts } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

/**
 * Inner layout that has access to AppProvider context.
 * Handles routing to onboarding vs. main tabs based on state.
 */
function InnerLayout() {
  const { isReady, needsOnboarding } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inSpotifyCallback = segments[0] === 'spotify-callback';

    // Never interrupt the OAuth redirect landing page.
    if (inSpotifyCallback) return;

    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (!needsOnboarding && inOnboarding) {
      router.replace('/(tabs)' as Href);
    }
  }, [isReady, needsOnboarding, segments, router]);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <AppText style={styles.loadingBrand}>ME TIME</AppText>
        <AppText muted style={styles.loadingTagline}>
          A little moment for yourself.
        </AppText>
        <ActivityIndicator
          color={colors.textMuted}
          size="small"
          style={styles.loadingSpinner}
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontFamily: fonts.display,
          fontSize: 20,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="mirror" />
      <Stack.Screen name="mirror/camera" options={{ animation: 'fade' }} />
      <Stack.Screen name="mirror/gallery" />
      <Stack.Screen name="mirror/viewer" options={{ animation: 'fade' }} />
      <Stack.Screen name="skin-care" />
      <Stack.Screen name="skin-care/edit" />
      <Stack.Screen name="skin-care/history" />
      <Stack.Screen name="write" />
      <Stack.Screen name="write/new" options={{ animation: 'fade' }} />
      <Stack.Screen name="write/entries" />
      <Stack.Screen name="write/entry" />
      <Stack.Screen name="write/notes" />
      <Stack.Screen name="soft-talk" />
      <Stack.Screen name="soft-talk/voice" />
      <Stack.Screen name="soft-talk/live" options={{ animation: 'fade' }} />
      <Stack.Screen name="music/category" />
      <Stack.Screen name="music/search" />
      <Stack.Screen name="music/player" />
      <Stack.Screen name="spotify-callback" options={{ animation: 'none' }} />
      <Stack.Screen name="games" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [serifLoaded, serifError] = useCormorant({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });
  const [sansLoaded, sansError] = useOutfit({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  const loaded = serifLoaded && sansLoaded;
  const error = serifError || sansError;

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <MusicPlayerProvider>
        <InnerLayout />
      </MusicPlayerProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingBrand: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 4,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  loadingTagline: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  loadingSpinner: {
    marginTop: 24,
  },
});
