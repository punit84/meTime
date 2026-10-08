import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
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
  createMemoryDeck,
  isMemoryComplete,
  MEMORY_CARD_TYPES,
  type MemoryCardItem,
} from '@/lib/games/memory';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

const TOTAL_PAIRS = MEMORY_CARD_TYPES.length; // 8

function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function MemoryGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [deck, setDeck] = useState<MemoryCardItem[]>(() => createMemoryDeck());
  const [firstSelectedId, setFirstSelectedId] = useState<string | null>(null);
  const [lockBoard, setLockBoard] = useState(false);
  const [turns, setTurns] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mismatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mismatchTimeoutRef.current) clearTimeout(mismatchTimeoutRef.current);
    };
  }, []);

  // Handle game timer
  useEffect(() => {
    if (isPlaying && !isComplete) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isComplete]);

  const handleRestart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mismatchTimeoutRef.current) clearTimeout(mismatchTimeoutRef.current);

    setDeck(createMemoryDeck());
    setFirstSelectedId(null);
    setLockBoard(false);
    setTurns(0);
    setMatchedPairs(0);
    setSeconds(0);
    setIsPlaying(false);
    setIsComplete(false);
  }, []);

  const handleCardPress = (card: MemoryCardItem) => {
    if (lockBoard || card.isMatched || card.isFlipped) return;

    if (!isPlaying) {
      setIsPlaying(true);
    }

    // Flip the tapped card
    const updatedDeck = deck.map((c) =>
      c.id === card.id ? { ...c, isFlipped: true } : c,
    );
    setDeck(updatedDeck);

    // Case 1: First card of the turn
    if (!firstSelectedId) {
      setFirstSelectedId(card.id);
      return;
    }

    // Case 2: Second card of the turn
    setLockBoard(true);
    setTurns((prev) => prev + 1);

    const firstCard = deck.find((c) => c.id === firstSelectedId);
    const isMatch = firstCard && firstCard.pairId === card.pairId;

    if (isMatch) {
      // Cards match!
      const matchedDeck = updatedDeck.map((c) =>
        c.id === firstSelectedId || c.id === card.id
          ? { ...c, isFlipped: true, isMatched: true }
          : c,
      );
      setDeck(matchedDeck);
      const newMatchedCount = matchedPairs + 1;
      setMatchedPairs(newMatchedCount);
      setFirstSelectedId(null);
      setLockBoard(false);

      if (isMemoryComplete(matchedDeck)) {
        setIsComplete(true);
        setIsPlaying(false);
      }
    } else {
      // Mismatch: unflip cards after a brief calm delay
      mismatchTimeoutRef.current = setTimeout(() => {
        setDeck((currentDeck) =>
          currentDeck.map((c) =>
            c.id === firstSelectedId || c.id === card.id
              ? { ...c, isFlipped: false }
              : c,
          ),
        );
        setFirstSelectedId(null);
        setLockBoard(false);
      }, 850);
    }
  };

  return (
    <Screen padded={false} edges={['left', 'right']}>
      {/* Top Header */}
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
          <AppText style={styles.tagText}>PAUSE & PLAY</AppText>
        </View>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Restart memory game"
        >
          <Ionicons name="refresh-outline" size={19} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.contentWrap}>
        {/* Title Header */}
        <View style={styles.headerSection}>
          <AppText style={styles.title}>Memory</AppText>
          <AppText muted style={styles.subtitle}>
            Gentle matching play.
          </AppText>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <AppText muted style={styles.statLabel}>
              PAIRS
            </AppText>
            <AppText style={styles.statValue}>
              {matchedPairs} / {TOTAL_PAIRS}
            </AppText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <AppText muted style={styles.statLabel}>
              TURNS
            </AppText>
            <AppText style={styles.statValue}>{turns}</AppText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <AppText muted style={styles.statLabel}>
              TIME
            </AppText>
            <AppText style={styles.statValue}>{formatTimer(seconds)}</AppText>
          </View>
        </View>

        {/* Memory Cards 4x4 Grid */}
        <View style={styles.boardWrapper}>
          <View style={styles.grid}>
            {deck.map((card) => {
              const isOpen = card.isFlipped || card.isMatched;

              return (
                <Pressable
                  key={card.id}
                  onPress={() => handleCardPress(card)}
                  disabled={isOpen || lockBoard}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isOpen ? `${card.name}${card.isMatched ? ', matched' : ''}` : 'Hidden card, tap to flip'
                  }
                  style={({ pressed }) => [
                    styles.card,
                    isOpen && [styles.cardFlipped, { backgroundColor: card.accentColor }],
                    card.isMatched && styles.cardMatched,
                    pressed && !isOpen && styles.cardPressed,
                  ]}
                >
                  {isOpen ? (
                    <AppText style={styles.cardEmoji}>{card.icon}</AppText>
                  ) : (
                    <View style={styles.cardBackContent}>
                      <Ionicons name="leaf-outline" size={18} color={colors.textMuted} style={styles.leafIcon} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <Pressable
            onPress={handleRestart}
            style={({ pressed }) => [styles.restartBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Reset Memory Game"
          >
            <Ionicons name="sparkles-outline" size={16} color={colors.accentDeep} />
            <AppText style={styles.restartBtnText}>New Shuffle</AppText>
          </Pressable>
        </View>
      </View>

      {/* Calm Completion Modal */}
      <Modal visible={isComplete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="sparkles" size={28} color={colors.accentDeep} />
            </View>

            <AppText style={styles.modalTitle}>You found them all.</AppText>
            <AppText muted style={styles.modalSubtitle}>
              “A little moment of focus.”
            </AppText>

            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatItem}>
                <AppText muted style={styles.modalStatLabel}>
                  TIME
                </AppText>
                <AppText style={styles.modalStatVal}>{formatTimer(seconds)}</AppText>
              </View>

              <View style={styles.modalStatDivider} />

              <View style={styles.modalStatItem}>
                <AppText muted style={styles.modalStatLabel}>
                  TURNS
                </AppText>
                <AppText style={styles.modalStatVal}>{turns}</AppText>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={handleRestart}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Play Again"
              >
                <AppText style={styles.modalPrimaryBtnText}>Play Again</AppText>
              </Pressable>

              <Pressable
                onPress={() => router.replace('/games')}
                style={({ pressed }) => [styles.modalSecondaryBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Back to Games"
              >
                <AppText style={styles.modalSecondaryBtnText}>Back to Games</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  contentWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 36,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
    width: '100%',
    maxWidth: 340,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    color: colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  boardWrapper: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    padding: spacing.sm,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  grid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 2,
  },
  card: {
    width: '23%',
    height: '23%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  cardFlipped: {
    borderColor: 'rgba(74, 59, 52, 0.15)',
  },
  cardMatched: {
    opacity: 0.9,
    borderColor: 'rgba(192, 139, 122, 0.35)',
  },
  cardPressed: {
    transform: [{ scale: 0.94 }],
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardBackContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafIcon: {
    opacity: 0.6,
  },
  bottomSection: {
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  restartBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 24, 20, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfacePeach,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  modalStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
    justifyContent: 'space-around',
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  modalStatVal: {
    fontFamily: fonts.bodySemi,
    fontSize: 18,
    color: colors.textPrimary,
  },
  modalStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  modalActions: {
    width: '100%',
    gap: spacing.sm,
  },
  modalPrimaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.white,
  },
  modalSecondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
