import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import {
  createLevelGrid,
  NUMBER_FLOW_LEVELS,
} from '@/lib/games/numberFlow';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

export default function NumberFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const [levelIndex, setLevelIndex] = useState(0);
  const [grid, setGrid] = useState<number[]>(() =>
    createLevelGrid(NUMBER_FLOW_LEVELS[0].totalNumbers)
  );
  const [nextExpected, setNextExpected] = useState(1);
  const [foundNumbers, setFoundNumbers] = useState<number[]>([]);
  const [hintText, setHintText] = useState<string | null>(null);
  const [levelSuccess, setLevelSuccess] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  // Animations
  const [shakeAnim] = useState(() => new Animated.Value(0));
  const [successAnim] = useState(() => new Animated.Value(0));

  // Timer refs
  const nextLevelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLevelConfig = NUMBER_FLOW_LEVELS[levelIndex] || NUMBER_FLOW_LEVELS[0];

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (nextLevelTimerRef.current) clearTimeout(nextLevelTimerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  // Start new level
  const loadLevel = useCallback((lvlIdx: number) => {
    if (nextLevelTimerRef.current) clearTimeout(nextLevelTimerRef.current);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);

    const config = NUMBER_FLOW_LEVELS[lvlIdx];
    setLevelIndex(lvlIdx);
    setGrid(createLevelGrid(config.totalNumbers));
    setNextExpected(1);
    setFoundNumbers([]);
    setHintText(null);
    setLevelSuccess(false);
  }, []);

  const handleRestart = useCallback(() => {
    setGameFinished(false);
    loadLevel(0);
  }, [loadLevel]);

  // Handle tile press
  const handleTilePress = (num: number) => {
    if (levelSuccess || gameFinished || foundNumbers.includes(num)) return;

    if (num === nextExpected) {
      // Correct number tapped
      const updatedFound = [...foundNumbers, num];
      setFoundNumbers(updatedFound);
      setHintText(null);

      if (num === currentLevelConfig.totalNumbers) {
        // Completed this level!
        setLevelSuccess(true);
        successAnim.setValue(0);
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }).start();

        nextLevelTimerRef.current = setTimeout(() => {
          if (levelIndex + 1 < NUMBER_FLOW_LEVELS.length) {
            loadLevel(levelIndex + 1);
          } else {
            setGameFinished(true);
          }
        }, 1200);
      } else {
        setNextExpected(num + 1);
      }
    } else {
      // Wrong number tapped: gentle subtle shake
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();

      setHintText(`Almost. Look for ${nextExpected}.`);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => {
        setHintText(null);
      }, 2000);
    }
  };

  // Grid sizing calculations
  const maxGameWidth = Math.min(windowWidth - 40, 480);
  const numColumns = currentLevelConfig.columns;
  const gap = currentLevelConfig.totalNumbers > 16 ? 8 : 10;
  const totalGapsWidth = gap * (numColumns - 1);
  const tileSize = Math.floor((maxGameWidth - totalGapsWidth) / numColumns);

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
            <AppText style={styles.headerTitle}>Number Flow</AppText>
            <AppText muted style={styles.headerSubtitle}>
              A simple focus game.
            </AppText>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {gameFinished ? (
          /* Game Completed State */
          <View style={styles.completionContainer}>
            <View style={styles.completionCard}>
              <View style={styles.completionIconCircle}>
                <Ionicons color={colors.accent} name="sparkles" size={32} />
              </View>

              <AppText style={styles.completionTitle}>
                Your mind was in the zone.
              </AppText>

              <AppText muted style={styles.completionSubtitle}>
                Nice work. That was a good little reset.
              </AppText>

              <View style={styles.summaryStatsBox}>
                <View style={styles.summaryStatItem}>
                  <AppText style={styles.summaryStatValue}>
                    {NUMBER_FLOW_LEVELS.length}
                  </AppText>
                  <AppText muted style={styles.summaryStatLabel}>
                    Levels Cleared
                  </AppText>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStatItem}>
                  <AppText style={styles.summaryStatValue}>
                    {NUMBER_FLOW_LEVELS.reduce((acc, l) => acc + l.totalNumbers, 0)}
                  </AppText>
                  <AppText muted style={styles.summaryStatLabel}>
                    Numbers Found
                  </AppText>
                </View>
              </View>

              <View style={styles.completionButtonRow}>
                <Pressable
                  accessibilityLabel="Play Again"
                  accessibilityRole="button"
                  onPress={handleRestart}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons color={colors.white} name="refresh" size={18} />
                  <AppText style={styles.primaryButtonText}>Play Again</AppText>
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
          /* Active Gameplay Flow */
          <View style={styles.playContent}>
            {/* Level & Target Header Bar */}
            <View style={styles.statusBar}>
              <View style={styles.levelPill}>
                <AppText style={styles.levelPillText}>
                  Level {levelIndex + 1} of {NUMBER_FLOW_LEVELS.length}
                </AppText>
              </View>

              <View style={styles.targetBox}>
                <AppText style={styles.targetPrompt}>Find</AppText>
                <View style={styles.targetBadge}>
                  <AppText style={styles.targetBadgeText}>
                    {nextExpected}
                  </AppText>
                </View>
              </View>

              <View style={styles.progressPill}>
                <AppText style={styles.progressPillText}>
                  {foundNumbers.length} / {currentLevelConfig.totalNumbers}
                </AppText>
              </View>
            </View>

            {/* Hint or gentle guidance */}
            <View style={styles.hintArea}>
              {hintText ? (
                <AppText style={styles.hintText}>{hintText}</AppText>
              ) : (
                <AppText muted style={styles.hintPlaceholder}>
                  Tap numbers in order from 1 to {currentLevelConfig.totalNumbers}
                </AppText>
              )}
            </View>

            {/* Number Grid Area */}
            <Animated.View
              style={[
                styles.gridContainer,
                {
                  width: maxGameWidth,
                  transform: [{ translateX: shakeAnim }],
                },
              ]}
            >
              {grid.map((num) => {
                const isFound = foundNumbers.includes(num);

                return (
                  <Pressable
                    key={num}
                    accessibilityLabel={`Number ${num}${isFound ? ' (found)' : ''}`}
                    accessibilityRole="button"
                    disabled={isFound}
                    onPress={() => handleTilePress(num)}
                    style={({ pressed }) => [
                      styles.tile,
                      {
                        width: tileSize,
                        height: tileSize,
                        margin: gap / 2,
                      },
                      isFound && styles.tileFound,
                      pressed && !isFound && styles.tilePressed,
                    ]}
                  >
                    {isFound ? (
                      <Ionicons
                        color={colors.accentDeep}
                        name="checkmark"
                        size={tileSize > 60 ? 24 : 18}
                      />
                    ) : (
                      <AppText
                        style={[
                          styles.tileNumber,
                          { fontSize: tileSize > 65 ? 24 : tileSize > 50 ? 20 : 17 },
                        ]}
                      >
                        {num}
                      </AppText>
                    )}
                  </Pressable>
                );
              })}

              {/* Level Success Overlay */}
              {levelSuccess && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.levelSuccessOverlay,
                    {
                      opacity: successAnim,
                      transform: [
                        {
                          scale: successAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.85, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.levelSuccessCard}>
                    <Ionicons color={colors.accent} name="sparkles" size={26} />
                    <AppText style={styles.levelSuccessTitle}>Nice flow ✨</AppText>
                    <AppText muted style={styles.levelSuccessSub}>
                      Preparing next level...
                    </AppText>
                  </View>
                </Animated.View>
              )}
            </Animated.View>

            {/* Bottom Calm Note */}
            <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <AppText muted style={styles.bottomInstruction}>
                Stay relaxed. Follow the flow at your own pace.
              </AppText>
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
  playContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  statusBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  levelPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    ...shadows.soft,
  },
  levelPillText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  targetBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  targetPrompt: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  targetBadge: {
    alignItems: 'center',
    backgroundColor: colors.accentDeep,
    borderRadius: radii.pill,
    height: 32,
    justifyContent: 'center',
    minWidth: 32,
    paddingHorizontal: 8,
  },
  targetBadgeText: {
    color: colors.white,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  progressPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    ...shadows.soft,
  },
  progressPillText: {
    color: colors.textPrimary,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  hintArea: {
    height: 24,
    justifyContent: 'center',
  },
  hintText: {
    color: colors.accentDeep,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    textAlign: 'center',
  },
  hintPlaceholder: {
    fontFamily: fonts.body,
    fontSize: 12,
    textAlign: 'center',
  },
  gridContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    position: 'relative',
  },
  tile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    ...shadows.soft,
  },
  tileFound: {
    backgroundColor: colors.surfaceSage,
    borderColor: 'rgba(188, 208, 190, 0.6)',
    opacity: 0.65,
    elevation: 0,
    shadowOpacity: 0,
  },
  tilePressed: {
    backgroundColor: colors.surfaceRose,
    transform: [{ scale: 0.95 }],
  },
  tileNumber: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
  },
  levelSuccessOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 50,
  },
  levelSuccessCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    ...shadows.soft,
  },
  levelSuccessTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 22,
    marginTop: 4,
  },
  levelSuccessSub: {
    fontFamily: fonts.body,
    fontSize: 13,
  },
  bottomArea: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  bottomInstruction: {
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: 'center',
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
    backgroundColor: colors.surfaceLavender,
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
  summaryStatsBox: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.xl,
    paddingVertical: spacing.md,
    width: '100%',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    fontSize: 24,
  },
  summaryStatLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    marginTop: 2,
  },
  summaryDivider: {
    backgroundColor: colors.border,
    height: '100%',
    width: 1,
  },
  completionButtonRow: {
    gap: spacing.sm,
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
