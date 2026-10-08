import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

type BreathPhase = 'inhale' | 'hold-in' | 'exhale' | 'rest';

interface PhaseConfig {
  name: BreathPhase;
  label: string;
  duration: number; // in seconds
  targetScale: number;
  glowOpacity: number;
}

const PHASES: PhaseConfig[] = [
  { name: 'inhale', label: 'Inhale', duration: 4, targetScale: 1.2, glowOpacity: 0.85 },
  { name: 'hold-in', label: 'Hold', duration: 4, targetScale: 1.2, glowOpacity: 0.85 },
  { name: 'exhale', label: 'Exhale', duration: 6, targetScale: 0.68, glowOpacity: 0.35 },
  { name: 'rest', label: 'Rest', duration: 2, targetScale: 0.68, glowOpacity: 0.25 },
];

const DURATION_OPTIONS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
];

function formatRemainingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function ZenBreathingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [sessionDuration, setSessionDuration] = useState(120); // 2 min default
  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState(120);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(PHASES[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Animated values
  const [orbScale] = useState(() => new Animated.Value(0.68));
  const [orbGlow] = useState(() => new Animated.Value(0.35));
  const [rippleScale] = useState(() => new Animated.Value(1));
  const [rippleOpacity] = useState(() => new Animated.Value(0.4));

  // Refs for timers and active animation
  const activeAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const rippleAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseIndexRef = useRef(phaseIndex);
  const isPausedRef = useRef(isPaused);
  const isCompletedRef = useRef(isCompleted);

  useEffect(() => {
    phaseIndexRef.current = phaseIndex;
  }, [phaseIndex]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
  }, [isCompleted]);

  // Ambient gentle ripple loop
  useEffect(() => {
    const ripple = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.45,
            duration: 4000,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0.05,
            duration: 4000,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0.4,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    rippleAnimRef.current = ripple;
    ripple.start();

    return () => {
      ripple.stop();
    };
  }, [rippleOpacity, rippleScale]);

  // Function to animate orb to target phase state
  const animateToPhase = useCallback(
    (phase: PhaseConfig, durationMs: number) => {
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
      }

      const anim = Animated.parallel([
        Animated.timing(orbScale, {
          toValue: phase.targetScale,
          duration: durationMs,
          easing: phase.name === 'hold-in' || phase.name === 'rest' ? Easing.linear : Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbGlow, {
          toValue: phase.glowOpacity,
          duration: durationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]);

      activeAnimRef.current = anim;
      anim.start();
    },
    [orbGlow, orbScale]
  );

  // Start/restart breathing session
  const startSession = useCallback(
    (durationSec: number) => {
      setSessionDuration(durationSec);
      setTotalSecondsRemaining(durationSec);
      setPhaseIndex(0);
      setPhaseSecondsLeft(PHASES[0].duration);
      setIsPaused(false);
      setIsCompleted(false);

      orbScale.setValue(0.68);
      orbGlow.setValue(0.35);

      animateToPhase(PHASES[0], PHASES[0].duration * 1000);
    },
    [animateToPhase, orbGlow, orbScale]
  );

  // Main 1-second interval timer
  useEffect(() => {
    if (isPaused || isCompleted) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTotalSecondsRemaining((prevTotal) => {
        if (prevTotal <= 1) {
          setIsCompleted(true);
          return 0;
        }
        return prevTotal - 1;
      });

      setPhaseSecondsLeft((prevSec) => {
        if (prevSec <= 1) {
          // Advance to next phase
          const nextIndex = (phaseIndexRef.current + 1) % PHASES.length;
          setPhaseIndex(nextIndex);
          const nextPhase = PHASES[nextIndex];
          animateToPhase(nextPhase, nextPhase.duration * 1000);
          return nextPhase.duration;
        }
        return prevSec - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [animateToPhase, isCompleted, isPaused]);

  // Initial animation launch on mount
  useEffect(() => {
    animateToPhase(PHASES[0], PHASES[0].duration * 1000);
    return () => {
      if (activeAnimRef.current) activeAnimRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [animateToPhase]);

  const handleTogglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      const currentPhase = PHASES[phaseIndex];
      animateToPhase(currentPhase, phaseSecondsLeft * 1000);
    } else {
      // Pause
      setIsPaused(true);
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
      }
    }
  };

  const handleDurationSelect = (seconds: number) => {
    startSession(seconds);
  };

  const handleEndEarly = () => {
    setIsCompleted(true);
  };

  const currentPhase = PHASES[phaseIndex];

  return (
    <Screen padded={false} scroll={false} style={styles.screen}>
      <View
        style={[
          styles.container,
          isWeb && { maxWidth: 520, alignSelf: 'center', width: '100%' },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <Pressable
            accessibilityLabel="Back to Games"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
          </Pressable>

          <View style={styles.headerTitles}>
            <AppText style={styles.headerTitle}>Zen Breathing</AppText>
            <AppText muted style={styles.headerSubtitle}>
              A quiet reset.
            </AppText>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {isCompleted ? (
          /* Completion Screen */
          <View style={styles.completionContainer}>
            <View style={styles.completionCard}>
              <View style={styles.completionIconCircle}>
                <Ionicons color={colors.accent} name="leaf-outline" size={32} />
              </View>

              <AppText style={styles.completionTitle}>
                You made space for yourself.
              </AppText>

              <AppText muted style={styles.completionSubtitle}>
                Carry that little bit of calm with you.
              </AppText>

              <View style={styles.completionButtonRow}>
                <Pressable
                  accessibilityLabel="Breathe Again"
                  accessibilityRole="button"
                  onPress={() => startSession(sessionDuration)}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons color={colors.white} name="refresh" size={18} />
                  <AppText style={styles.primaryButtonText}>Breathe Again</AppText>
                </Pressable>

                <Pressable
                  accessibilityLabel="Back to Games"
                  accessibilityRole="button"
                  onPress={() => router.back()}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <AppText style={styles.secondaryButtonText}>Back to Games</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          /* Active Breathing Flow */
          <View style={styles.mainContent}>
            {/* Duration Selector Pills */}
            <View style={styles.durationSelector}>
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = sessionDuration === opt.seconds;
                return (
                  <Pressable
                    key={opt.seconds}
                    accessibilityLabel={`Set duration to ${opt.label}`}
                    accessibilityRole="button"
                    onPress={() => handleDurationSelect(opt.seconds)}
                    style={[
                      styles.durationPill,
                      isSelected && styles.durationPillSelected,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.durationPillText,
                        isSelected && styles.durationPillTextSelected,
                      ]}
                    >
                      {opt.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Central Breathing Orb Area */}
            <View style={styles.orbArea}>
              {/* Expanding soft ripple */}
              <Animated.View
                style={[
                  styles.orbRipple,
                  {
                    transform: [{ scale: rippleScale }],
                    opacity: rippleOpacity,
                  },
                ]}
              />

              {/* Secondary soft outer aura */}
              <Animated.View
                style={[
                  styles.orbAura,
                  {
                    transform: [{ scale: orbScale }],
                    opacity: orbGlow,
                  },
                ]}
              />

              {/* Main Glowing Breathing Orb */}
              <Animated.View
                style={[
                  styles.orbCore,
                  {
                    transform: [{ scale: orbScale }],
                  },
                ]}
              >
                {/* Soft specular glow inside orb */}
                <View style={styles.orbInnerGlow} />
              </Animated.View>
            </View>

            {/* Phase Guidance and Countdown */}
            <View style={styles.guidanceContainer}>
              <AppText style={styles.phaseLabel}>{currentPhase.label}</AppText>
              <AppText style={styles.countdownNumber}>{phaseSecondsLeft}</AppText>
            </View>

            {/* Bottom Calm Note & Controls */}
            <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <AppText muted style={styles.bottomNote}>
                {isPaused
                  ? `Session paused · ${formatRemainingTime(totalSecondsRemaining)} remaining`
                  : 'Follow the circle. Nothing else to do.'}
              </AppText>

              <View style={styles.controlsRow}>
                <Pressable
                  accessibilityLabel={isPaused ? 'Resume breathing' : 'Pause breathing'}
                  accessibilityRole="button"
                  onPress={handleTogglePause}
                  style={({ pressed }) => [
                    styles.controlButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons
                    color={colors.textPrimary}
                    name={isPaused ? 'play' : 'pause'}
                    size={20}
                  />
                  <AppText style={styles.controlButtonText}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </AppText>
                </Pressable>

                <Pressable
                  accessibilityLabel="End session"
                  accessibilityRole="button"
                  onPress={handleEndEarly}
                  style={({ pressed }) => [
                    styles.controlButtonSecondary,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <AppText style={styles.controlButtonSecondaryText}>End</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
    ...shadows.soft,
  },
  backButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  headerTitles: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 24,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  durationSelector: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    ...shadows.soft,
  },
  durationPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  durationPillSelected: {
    backgroundColor: colors.surfaceRose,
  },
  durationPillText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  durationPillTextSelected: {
    color: colors.accentDeep,
    fontFamily: fonts.bodySemi,
  },
  orbArea: {
    alignItems: 'center',
    height: 260,
    justifyContent: 'center',
    position: 'relative',
    width: 260,
  },
  orbRipple: {
    backgroundColor: 'rgba(243, 224, 228, 0.45)',
    borderColor: 'rgba(224, 180, 192, 0.5)',
    borderRadius: 130,
    borderWidth: 1,
    height: 260,
    position: 'absolute',
    width: 260,
  },
  orbAura: {
    backgroundColor: 'rgba(234, 230, 239, 0.7)',
    borderRadius: 110,
    height: 220,
    position: 'absolute',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 8,
    width: 220,
  },
  orbCore: {
    alignItems: 'center',
    backgroundColor: 'rgba(244, 230, 218, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 85,
    borderWidth: 2,
    height: 170,
    justifyContent: 'center',
    shadowColor: '#C08B7A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
    width: 170,
  },
  orbInnerGlow: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 35,
    height: 70,
    left: 28,
    position: 'absolute',
    top: 24,
    transform: [{ rotate: '-35deg' }],
    width: 80,
  },
  guidanceContainer: {
    alignItems: 'center',
    marginTop: -spacing.sm,
  },
  phaseLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 34,
    letterSpacing: 0.5,
  },
  countdownNumber: {
    color: colors.accentDeep,
    fontFamily: fonts.bodySemi,
    fontSize: 26,
    marginTop: 2,
  },
  bottomContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  bottomNote: {
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    ...shadows.soft,
  },
  controlButtonText: {
    color: colors.textPrimary,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
  controlButtonSecondary: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  controlButtonSecondaryText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  completionContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  completionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    width: '100%',
    ...shadows.soft,
  },
  completionIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSage,
    borderRadius: radii.pill,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 72,
  },
  completionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 26,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  completionButtonRow: {
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accentDeep,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs + 2,
    justifyContent: 'center',
    paddingVertical: spacing.md,
    width: '100%',
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
    width: '100%',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
