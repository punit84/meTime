/**
 * Spotify OAuth redirect landing page.
 * Must exist so Expo Router doesn't show Not Found after login.
 * Completes the AuthSession popup/redirect handshake.
 */
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/lib/theme';

WebBrowser.maybeCompleteAuthSession();

export default function SpotifyCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const result = WebBrowser.maybeCompleteAuthSession();

    // Popup flow: close this window so AuthSession in the opener can finish.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.opener && !window.opener.closed) {
        // Give the opener a beat to receive the auth result, then close.
        const t = setTimeout(() => {
          try {
            window.close();
          } catch {
            // ignore
          }
        }, 400);
        return () => clearTimeout(t);
      }

      // Same-tab fallback: send the user back into the app.
      if (!result?.type || result.type === 'failed') {
        const t = setTimeout(() => {
          router.replace('/(tabs)/listen');
        }, 800);
        return () => clearTimeout(t);
      }
    }
  }, [router]);

  return (
    <Screen>
      <View style={styles.wrap}>
        <AppText variant="title">Spotify</AppText>
        <AppText muted style={styles.copy}>
          Finishing connection… You can close this window and return to Me Time.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  copy: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
});
