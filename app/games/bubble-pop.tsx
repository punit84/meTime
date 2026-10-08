import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
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
import {
  type BubbleMessage,
  getRandomBubbleMessage,
} from '@/lib/games/bubblePopMessages';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

const MAX_RECENT_HISTORY = 12;
const DEFAULT_CONTAINER_HEIGHT = 650;

interface BubblePalette {
  bg: string;
  border: string;
  glow: string;
}

const BUBBLE_PALETTES: BubblePalette[] = [
  // 0: Soft Rose
  {
    bg: 'rgba(243, 218, 222, 0.82)',
    border: 'rgba(196, 140, 155, 0.85)',
    glow: 'rgba(243, 218, 222, 0.5)',
  },
  // 1: Muted Lavender
  {
    bg: 'rgba(230, 224, 242, 0.82)',
    border: 'rgba(172, 158, 205, 0.85)',
    glow: 'rgba(230, 224, 242, 0.5)',
  },
  // 2: Soft Sage
  {
    bg: 'rgba(224, 236, 224, 0.82)',
    border: 'rgba(155, 185, 158, 0.85)',
    glow: 'rgba(224, 236, 224, 0.5)',
  },
  // 3: Soft Peach
  {
    bg: 'rgba(248, 226, 212, 0.82)',
    border: 'rgba(215, 168, 142, 0.85)',
    glow: 'rgba(248, 226, 212, 0.5)',
  },
  // 4: Warm Cream / Pearl
  {
    bg: 'rgba(255, 250, 242, 0.88)',
    border: 'rgba(210, 195, 172, 0.85)',
    glow: 'rgba(255, 250, 242, 0.5)',
  },
];

interface BubbleConfig {
  id: number;
  size: number;
  xPct: number;
  initialYPct: number;
  paletteIndex: number;
  speed: number;
}

const INITIAL_BUBBLE_CONFIGS: BubbleConfig[] = [
  { id: 1, size: 68, xPct: 10, initialYPct: 20, paletteIndex: 0, speed: 8500 },
  { id: 2, size: 60, xPct: 35, initialYPct: 30, paletteIndex: 1, speed: 7800 },
  { id: 3, size: 72, xPct: 65, initialYPct: 18, paletteIndex: 2, speed: 9200 },
  { id: 4, size: 58, xPct: 80, initialYPct: 42, paletteIndex: 3, speed: 8100 },
  { id: 5, size: 70, xPct: 20, initialYPct: 50, paletteIndex: 4, speed: 8900 },
  { id: 6, size: 62, xPct: 50, initialYPct: 60, paletteIndex: 0, speed: 7500 },
  { id: 7, size: 66, xPct: 75, initialYPct: 70, paletteIndex: 1, speed: 8700 },
  { id: 8, size: 64, xPct: 40, initialYPct: 80, paletteIndex: 3, speed: 8300 },
];

interface ActiveBubble {
  config: BubbleConfig;
  translateY: Animated.Value;
  wobbleX: Animated.Value;
  popScale: Animated.Value;
  popOpacity: Animated.Value;
}

interface BurstEffect {
  id: number;
  xPct: number;
  yPos: number;
  size: number;
  anim: Animated.Value;
  paletteIndex: number;
}

const CATEGORY_LABELS: Record<BubbleMessage['category'], string> = {
  funny: 'Just saying 😂',
  flirty: 'Flirty vibe ✨',
  cute: 'Cute reminder 🫶',
  love: 'Romantic with life 🌸',
  compliment: 'A real compliment 😌',
  relatable: 'Real talk 👀',
  motivation: 'Gentle nudge 💫',
  chaotic: 'Tiny victory 🤌',
};

export default function BubblePopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [containerHeight, setContainerHeight] = useState(DEFAULT_CONTAINER_HEIGHT);
  const [activeMessage, setActiveMessage] = useState<BubbleMessage | null>(null);
  const [recentMessageIds, setRecentMessageIds] = useState<string[]>([]);
  const [bursts, setBursts] = useState<BurstEffect[]>([]);
  const [hasPoppedFirst, setHasPoppedFirst] = useState(false);

  // Message animated values
  const [messageOpacity] = useState(() => new Animated.Value(0));
  const [messageTranslateY] = useState(() => new Animated.Value(12));

  // Initialize bubbles with exact coordinates
  const [bubbles] = useState<ActiveBubble[]>(() =>
    INITIAL_BUBBLE_CONFIGS.map((config) => {
      const initialY = (config.initialYPct / 100) * DEFAULT_CONTAINER_HEIGHT;
      return {
        config,
        translateY: new Animated.Value(initialY),
        wobbleX: new Animated.Value(0),
        popScale: new Animated.Value(1),
        popOpacity: new Animated.Value(1),
      };
    })
  );

  // Refs
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animsRef = useRef<Map<number, Animated.CompositeAnimation>>(new Map());
  const wobbleAnimsRef = useRef<Map<number, Animated.CompositeAnimation>>(new Map());
  const poppingMapRef = useRef<Map<number, boolean>>(new Map());
  const burstCounterRef = useRef(1);
  const heightRef = useRef(DEFAULT_CONTAINER_HEIGHT);
  const hasStartedRef = useRef(false);

  // Function to continuously float a bubble upward
  const floatBubbleRef = useRef<
    (bubble: ActiveBubble, startY: number, targetY: number, duration: number) => void
  >(() => {});

  const floatBubble = useCallback(
    (bubble: ActiveBubble, startY: number, targetY: number, duration: number) => {
      if (poppingMapRef.current.get(bubble.config.id)) return;

      bubble.translateY.setValue(startY);

      // Horizontal subtle wobble
      if (!wobbleAnimsRef.current.has(bubble.config.id)) {
        const wobble = Animated.loop(
          Animated.sequence([
            Animated.timing(bubble.wobbleX, {
              toValue: 10,
              duration: 2200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(bubble.wobbleX, {
              toValue: -10,
              duration: 2200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(bubble.wobbleX, {
              toValue: 0,
              duration: 2200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
        wobbleAnimsRef.current.set(bubble.config.id, wobble);
        wobble.start();
      }

      // Vertical rise animation
      const riseAnim = Animated.timing(bubble.translateY, {
        toValue: targetY,
        duration: Math.max(1000, duration),
        easing: Easing.linear,
        useNativeDriver: true,
      });

      animsRef.current.set(bubble.config.id, riseAnim);

      riseAnim.start(({ finished }) => {
        if (finished && !poppingMapRef.current.get(bubble.config.id)) {
          // Reset to bottom and float all the way to top
          const bottomY = heightRef.current + 20;
          const topY = -bubble.config.size - 30;
          bubble.popScale.setValue(1);
          bubble.popOpacity.setValue(1);
          floatBubbleRef.current(bubble, bottomY, topY, bubble.config.speed);
        }
      });
    },
    []
  );

  useEffect(() => {
    floatBubbleRef.current = floatBubble;
  }, [floatBubble]);

  // Start animations once layout is ready
  const startAllBubbles = useCallback(
    (currentHeight: number) => {
      bubbles.forEach((bubble) => {
        const initialY = (bubble.config.initialYPct / 100) * currentHeight;
        const topY = -bubble.config.size - 30;
        const totalDistance = currentHeight + bubble.config.size + 50;
        const remainingDistance = initialY - topY;
        const remainingDuration =
          bubble.config.speed * (remainingDistance / totalDistance);

        floatBubble(bubble, initialY, topY, remainingDuration);
      });
    },
    [bubbles, floatBubble]
  );

  // Layout handler
  const handleLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 50) {
      setContainerHeight(height);
      heightRef.current = height;

      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        startAllBubbles(height);
      }
    }
  };

  // Fallback initial start if onLayout is delayed on some platforms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        startAllBubbles(heightRef.current);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [startAllBubbles]);

  // Pop bubble handler
  const handlePopBubble = (bubble: ActiveBubble) => {
    const bubbleId = bubble.config.id;
    if (poppingMapRef.current.get(bubbleId)) return;
    poppingMapRef.current.set(bubbleId, true);

    const activeAnim = animsRef.current.get(bubbleId);
    if (activeAnim) {
      activeAnim.stop();
    }

    if (!hasPoppedFirst) {
      setHasPoppedFirst(true);
    }

    // 1. Pop animation (quick scale & fade)
    Animated.parallel([
      Animated.timing(bubble.popScale, {
        toValue: 1.35,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(bubble.popOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Respawn at bottom after a calm pause
      setTimeout(() => {
        poppingMapRef.current.set(bubbleId, false);
        bubble.popScale.setValue(1);
        bubble.popOpacity.setValue(1);

        const bottomY = heightRef.current + 20;
        const topY = -bubble.config.size - 30;
        floatBubbleRef.current(bubble, bottomY, topY, bubble.config.speed);
      }, 400);
    });

    // 3. Trigger burst ripple at bubble's horizontal position
    const burstId = burstCounterRef.current++;
    const burstAnim = new Animated.Value(0);
    const newBurst: BurstEffect = {
      id: burstId,
      xPct: bubble.config.xPct,
      yPos: (bubble.config.initialYPct / 100) * heightRef.current,
      size: bubble.config.size,
      anim: burstAnim,
      paletteIndex: bubble.config.paletteIndex,
    };

    setBursts((prev) => [...prev.slice(-3), newBurst]);
    Animated.timing(burstAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    });

    // 4. Reveal message
    const nextMessage = getRandomBubbleMessage(recentMessageIds);
    setActiveMessage(nextMessage);

    setRecentMessageIds((prev) => {
      const updated = [nextMessage.id, ...prev];
      return updated.length > MAX_RECENT_HISTORY
        ? updated.slice(0, MAX_RECENT_HISTORY)
        : updated;
    });

    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }

    messageOpacity.setValue(0);
    messageTranslateY.setValue(12);

    Animated.parallel([
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(messageTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-fade message after 5.5 seconds
    messageTimerRef.current = setTimeout(() => {
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 550,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, 5500);
  };

  const handleDismissMessage = () => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    Animated.timing(messageOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  // Cleanup animations on unmount
  useEffect(() => {
    const riseAnims = animsRef.current;
    const wobbleAnims = wobbleAnimsRef.current;
    return () => {
      riseAnims.forEach((anim) => anim.stop());
      wobbleAnims.forEach((anim) => anim.stop());
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

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
            <AppText style={styles.headerTitle}>Bubble Pop</AppText>
            <AppText muted style={styles.headerSubtitle}>
              A little something nice for you.
            </AppText>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Main Floating Play Area (Non-scrollable, full height, relative) */}
        <View onLayout={handleLayout} style={styles.playArea}>
          {/* Subtle Ambient Glow */}
          <View pointerEvents="none" style={styles.ambientGlow} />

          {/* Initial Prompt before first pop */}
          {!hasPoppedFirst && !activeMessage && (
            <View pointerEvents="none" style={styles.initialPrompt}>
              <View style={styles.initialPromptCard}>
                <Ionicons color={colors.accent} name="sparkles-outline" size={18} />
                <AppText style={styles.initialPromptText}>
                  Tap any bubble to receive a little warmth.
                </AppText>
              </View>
            </View>
          )}

          {/* 8 Active Visible Bubbles */}
          {bubbles.map((bubble) => {
            const palette = BUBBLE_PALETTES[bubble.config.paletteIndex];

            return (
              <Animated.View
                key={bubble.config.id}
                style={[
                  styles.bubbleWrapper,
                  {
                    left: `${bubble.config.xPct}%`,
                    width: bubble.config.size,
                    height: bubble.config.size,
                    transform: [
                      { translateY: bubble.translateY },
                      { translateX: bubble.wobbleX },
                      { scale: bubble.popScale },
                    ],
                    opacity: bubble.popOpacity,
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel="Pop bubble"
                  accessibilityRole="button"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => handlePopBubble(bubble)}
                  style={[
                    styles.bubbleBody,
                    {
                      width: bubble.config.size,
                      height: bubble.config.size,
                      borderRadius: bubble.config.size / 2,
                      backgroundColor: palette.bg,
                      borderColor: palette.border,
                      shadowColor: palette.border,
                    },
                  ]}
                >
                  {/* Highlight crescent */}
                  <View
                    style={[
                      styles.bubbleHighlight,
                      {
                        width: bubble.config.size * 0.35,
                        height: bubble.config.size * 0.22,
                        borderRadius: bubble.config.size * 0.15,
                      },
                    ]}
                  />

                  {/* Soft rim glow */}
                  <View
                    style={[
                      styles.bubbleRimGlow,
                      {
                        width: bubble.config.size * 0.28,
                        height: bubble.config.size * 0.28,
                        borderRadius: bubble.config.size * 0.14,
                      },
                    ]}
                  />
                </Pressable>
              </Animated.View>
            );
          })}

          {/* Burst Particle Rings */}
          {bursts.map((burst) => {
            const palette = BUBBLE_PALETTES[burst.paletteIndex];
            const ringScale = burst.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 2.2],
            });
            const ringOpacity = burst.anim.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0.95, 0.6, 0],
            });

            return (
              <Animated.View
                key={burst.id}
                pointerEvents="none"
                style={[
                  styles.burstContainer,
                  {
                    left: `${burst.xPct}%`,
                    top: Math.max(50, Math.min(containerHeight - 100, burst.yPos)),
                    width: burst.size,
                    height: burst.size,
                    transform: [{ scale: ringScale }],
                    opacity: ringOpacity,
                  },
                ]}
              >
                <View
                  style={[
                    styles.burstRing,
                    {
                      width: burst.size,
                      height: burst.size,
                      borderRadius: burst.size / 2,
                      borderColor: palette.border,
                    },
                  ]}
                />
              </Animated.View>
            );
          })}

          {/* Pop Message Banner (Floating in bottom portion) */}
          {activeMessage && (
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.messageContainer,
                {
                  paddingBottom: Math.max(insets.bottom, 24),
                  opacity: messageOpacity,
                  transform: [{ translateY: messageTranslateY }],
                },
              ]}
            >
              <Pressable
                accessibilityLabel="Message card. Tap to dismiss."
                accessibilityRole="button"
                onPress={handleDismissMessage}
                style={({ pressed }) => [
                  styles.messageCard,
                  pressed && styles.messageCardPressed,
                ]}
              >
                <View style={styles.messageCategoryRow}>
                  <Ionicons color={colors.accent} name="sparkles" size={14} />
                  <AppText style={styles.messageCategory}>
                    {CATEGORY_LABELS[activeMessage.category] || 'A little note'}
                  </AppText>
                </View>

                <AppText style={styles.messageText}>
                  “{activeMessage.text}”
                </AppText>

                <View style={styles.messageCardFooter}>
                  <AppText muted style={styles.messageDismissHint}>
                    Tap to dismiss or pop another
                  </AppText>
                </View>
              </Pressable>
            </Animated.View>
          )}
        </View>
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
  playArea: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  ambientGlow: {
    backgroundColor: 'rgba(243, 235, 226, 0.45)',
    borderRadius: radii.xl,
    bottom: 20,
    left: 16,
    position: 'absolute',
    right: 16,
    top: 20,
  },
  initialPrompt: {
    alignItems: 'center',
    bottom: '42%',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  initialPromptCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    ...shadows.soft,
  },
  initialPromptText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  bubbleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 20,
  },
  bubbleBody: {
    alignItems: 'center',
    borderWidth: 1.5,
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  bubbleHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    left: '18%',
    position: 'absolute',
    top: '16%',
    transform: [{ rotate: '-28deg' }],
  },
  bubbleRimGlow: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    bottom: '16%',
    position: 'absolute',
    right: '18%',
  },
  burstContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 25,
  },
  burstRing: {
    borderWidth: 2,
  },
  messageContainer: {
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    right: 0,
    zIndex: 40,
  },
  messageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    ...shadows.soft,
  },
  messageCardPressed: {
    opacity: 0.95,
  },
  messageCategoryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.xs + 2,
  },
  messageCategory: {
    color: colors.accentDeep,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  messageText: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 21,
    lineHeight: 28,
    marginVertical: 4,
  },
  messageCardFooter: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  messageDismissHint: {
    fontFamily: fonts.body,
    fontSize: 11,
  },
});
