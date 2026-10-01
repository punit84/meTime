import { useEffect } from 'react';
import { Stack } from 'expo-router';
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
import { colors, fonts } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

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
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="mirror" />
      <Stack.Screen name="skin-care" />
      <Stack.Screen name="write" />
      <Stack.Screen name="games" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
