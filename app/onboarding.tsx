import { useEffect, useState } from 'react';
import {
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/AppText';
import { useApp } from '@/lib/AppProvider';
import { colors, fonts, radii, spacing } from '@/lib/theme';

export default function OnboardingScreen() {
  const { finishOnboarding } = useApp();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(24));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const trimmed = name.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= 40;

  const handleContinue = async () => {
    if (!isValid || saving) return;

    Keyboard.dismiss();
    setError('');
    setSaving(true);

    try {
      await finishOnboarding(trimmed);
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Animated.View
        style={[
          styles.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Brand */}
        <AppText style={styles.brand}>ME TIME</AppText>
        <AppText style={styles.tagline}>
          A little space, just for you.
        </AppText>

        {/* Prompt */}
        <View style={styles.promptWrap}>
          <AppText style={styles.prompt}>What should I call you?</AppText>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError('');
            }}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            accessibilityLabel="Your name"
            accessibilityHint="Enter the name you'd like to be greeted with"
          />

          {error ? (
            <AppText style={styles.error}>{error}</AppText>
          ) : null}

          <Pressable
            onPress={handleContinue}
            disabled={!isValid || saving}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !isValid || saving }}
            style={({ pressed }) => [
              styles.button,
              (!isValid || saving) && styles.buttonDisabled,
              pressed && isValid && !saving && styles.buttonPressed,
            ]}
          >
            <AppText
              style={[
                styles.buttonText,
                (!isValid || saving) && styles.buttonTextDisabled,
              ]}
            >
              {saving ? 'Setting up…' : 'Continue'}
            </AppText>
          </Pressable>

          <AppText muted style={styles.hint}>
            You can change this anytime in Settings.
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  inner: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  brand: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 4,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  tagline: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxl + spacing.lg,
  },
  promptWrap: {
    width: '100%',
  },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#C06050',
    marginBottom: spacing.sm,
    marginTop: -spacing.sm,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: colors.selected,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceWarm,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.white,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
