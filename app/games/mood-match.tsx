import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import {
  calculateMoodSummary,
  createMoodMatchSession,
  MOOD_OPTIONS,
  type MoodMatchRound,
} from '@/lib/games/moodMatch';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { MoodType } from '@/lib/types';
import type { MoodConfig } from '@/lib/types-phase1';

export default function MoodMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [rounds, setRounds] = useState<MoodMatchRound[]>(() => createMoodMatchSession());
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [answers, setAnswers] = useState<MoodType[]>([]);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  // Transition timer ref
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fadeAnim] = useState(() => new Animated.Value(1));

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  const handleRestart = useCallback(() => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setRounds(createMoodMatchSession());
    setCurrentRoundIndex(0);
    setSelectedMood(null);
    setAnswers([]);
    setFeedbackText(null);
    setIsTransitioning(false);
    setGameFinished(false);
    fadeAnim.setValue(1);
  }, [fadeAnim]);

  const currentRound = rounds[currentRoundIndex];

  const handleMoodSelect = (moodConfig: MoodConfig) => {
    if (isTransitioning || gameFinished || !currentRound) return;

    const chosenMood = moodConfig.id;
    setSelectedMood(chosenMood);
    setIsTransitioning(true);

    const feedback = currentRound.responses[chosenMood] || 'A quiet, gentle pause.';
    setFeedbackText(feedback);

    const newAnswers = [...answers, chosenMood];
    setAnswers(newAnswers);

    // After a peaceful pause, transition to next round or finish
    transitionTimerRef.current = setTimeout(() => {
      if (currentRoundIndex + 1 < rounds.length) {
        // Fade transition between scenes
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.2,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start();

        setCurrentRoundIndex((prev) => prev + 1);
        setSelectedMood(null);
        setFeedbackText(null);
        setIsTransitioning(false);
      } else {
        // Game complete
        setGameFinished(true);
        setIsTransitioning(false);
      }
    }, 1100);
  };

  const moodSummary = calculateMoodSummary(answers);

  return (
    <Screen padded={false} edges={['left', 'right']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to games"
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.tagBadge}>
          <AppText style={styles.tagText}>
            {gameFinished
              ? 'REFLECT'
              : `ROUND ${currentRoundIndex + 1} OF ${rounds.length}`}
          </AppText>
        </View>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Restart mood match game"
        >
          <Ionicons name="refresh-outline" size={19} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          {!gameFinished && currentRound ? (
            <Animated.View style={[styles.gameContainer, { opacity: fadeAnim }]}>
              {/* Header */}
              <View style={styles.headerSection}>
                <AppText style={styles.title}>Mood Match</AppText>
                <AppText muted style={styles.subtitle}>
                  A tiny game about how things feel.
                </AppText>
              </View>

              {/* Progress Dots */}
              <View style={styles.progressRow} accessibilityLabel={`Round ${currentRoundIndex + 1} of ${rounds.length}`}>
                {rounds.map((r, i) => {
                  const isPast = i < currentRoundIndex;
                  const isCurrent = i === currentRoundIndex;
                  return (
                    <View
                      key={r.id}
                      style={[
                        styles.progressSegment,
                        isPast && styles.progressSegmentPast,
                        isCurrent && styles.progressSegmentCurrent,
                      ]}
                    />
                  );
                })}
              </View>

              {/* Scene Card */}
              <View style={styles.sceneCard}>
                <View style={styles.imageContainer}>
                  <Image
                    source={currentRound.image}
                    style={styles.sceneImage}
                    resizeMode="cover"
                    accessibilityLabel={currentRound.title}
                  />
                </View>
                <View style={styles.sceneInfo}>
                  <AppText style={styles.sceneTitle}>{currentRound.title}</AppText>
                  <AppText muted style={styles.sceneDescription}>
                    {currentRound.description}
                  </AppText>
                </View>
              </View>

              {/* Question Prompt */}
              <View style={styles.promptSection}>
                <AppText style={styles.promptText}>{currentRound.prompt}</AppText>
              </View>

              {/* Mood Choice Options */}
              <View style={styles.moodChoicesRow} accessibilityRole="radiogroup">
                {MOOD_OPTIONS.map((mood) => {
                  const isSelected = selectedMood === mood.id;

                  return (
                    <Pressable
                      key={mood.id}
                      onPress={() => handleMoodSelect(mood)}
                      disabled={isTransitioning}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${mood.title}. ${mood.description}`}
                      style={({ pressed }) => [
                        styles.moodCard,
                        { backgroundColor: mood.wash },
                        isSelected && [
                          styles.moodCardSelected,
                          { borderColor: mood.accent },
                        ],
                        pressed && !isTransitioning && styles.moodCardPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.moodIconCircle,
                          isSelected && { backgroundColor: mood.accent },
                        ]}
                      >
                        <Ionicons
                          name={mood.icon}
                          size={18}
                          color={isSelected ? colors.white : mood.accent}
                        />
                      </View>
                      <AppText
                        style={[
                          styles.moodTitle,
                          isSelected && styles.moodTitleSelected,
                        ]}
                      >
                        {mood.title}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Feedback Banner */}
              <View style={styles.feedbackContainer}>
                {feedbackText ? (
                  <View style={styles.feedbackBubble}>
                    <Ionicons
                      name="sparkles-outline"
                      size={14}
                      color={colors.accentDeep}
                    />
                    <AppText style={styles.feedbackText}>{feedbackText}</AppText>
                  </View>
                ) : (
                  <AppText muted style={styles.feedbackPlaceholder}>
                    Choose whatever feels natural to you.
                  </AppText>
                )}
              </View>
            </Animated.View>
          ) : (
            /* Result / Summary Screen */
            <View style={styles.resultCard}>
              <View style={styles.resultIconCircle}>
                <Ionicons name="sparkles" size={28} color={colors.accentDeep} />
              </View>

              <AppText style={styles.resultTitle}>Your little mood moment</AppText>
              <AppText muted style={styles.resultSubtitle}>
                “Whatever you’re feeling is allowed.”
              </AppText>

              {/* Summary Breakdown */}
              <View style={styles.summaryList}>
                {MOOD_OPTIONS.map((mood) => {
                  const count = moodSummary[mood.id] || 0;
                  const ratio = answers.length > 0 ? count / answers.length : 0;

                  return (
                    <View key={mood.id} style={styles.summaryItem}>
                      <View style={styles.summaryLeft}>
                        <View
                          style={[
                            styles.summaryIconCircle,
                            { backgroundColor: mood.wash },
                          ]}
                        >
                          <Ionicons
                            name={mood.icon}
                            size={16}
                            color={mood.accent}
                          />
                        </View>
                        <AppText style={styles.summaryMoodName}>
                          {mood.title}
                        </AppText>
                      </View>

                      {/* Bar Visualization */}
                      <View style={styles.summaryBarTrack}>
                        <View
                          style={[
                            styles.summaryBarFill,
                            {
                              width: `${Math.max(ratio * 100, 0)}%`,
                              backgroundColor: count > 0 ? mood.accent : 'transparent',
                            },
                          ]}
                        />
                      </View>

                      <AppText style={styles.summaryCount}>
                        {count}
                      </AppText>
                    </View>
                  );
                })}
              </View>

              {/* Bottom Actions */}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={handleRestart}
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Play Again"
                >
                  <AppText style={styles.primaryActionBtnText}>Play Again</AppText>
                </Pressable>

                <Pressable
                  onPress={() => router.replace('/games')}
                  style={({ pressed }) => [
                    styles.secondaryActionBtn,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Games"
                >
                  <AppText style={styles.secondaryActionBtnText}>
                    Back to Games
                  </AppText>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  tagBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  gameContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    lineHeight: 34,
    color: colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: spacing.md,
    width: '100%',
    maxWidth: 220,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(74, 59, 52, 0.12)',
  },
  progressSegmentPast: {
    backgroundColor: colors.accent,
  },
  progressSegmentCurrent: {
    backgroundColor: colors.selected,
  },
  sceneCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: colors.surfaceWarm,
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
  sceneInfo: {
    padding: spacing.md,
    alignItems: 'center',
  },
  sceneTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  sceneDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  promptSection: {
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  promptText: {
    fontFamily: fonts.display,
    fontSize: 17,
    fontStyle: 'italic',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  moodChoicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: spacing.md,
  },
  moodCard: {
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: 120,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  moodCardSelected: {
    borderWidth: 1.5,
    transform: [{ scale: 1.03 }],
    ...shadows.soft,
  },
  moodCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  moodIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  moodTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  moodTitleSelected: {
    fontFamily: fonts.bodySemi,
  },
  feedbackContainer: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  feedbackBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfacePeach,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(192, 139, 122, 0.25)',
  },
  feedbackText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  feedbackPlaceholder: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  resultCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
    marginTop: spacing.sm,
  },
  resultIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfacePeach,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  summaryList: {
    width: '100%',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 90,
  },
  summaryIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryMoodName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  summaryBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(74, 59, 52, 0.08)',
    borderRadius: radii.pill,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  summaryCount: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textPrimary,
    width: 20,
    textAlign: 'right',
  },
  modalActions: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.white,
  },
  secondaryActionBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
