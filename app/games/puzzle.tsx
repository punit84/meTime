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
  createSolvablePuzzle,
  isAdjacent,
  isPuzzleSolved,
  moveTile,
} from '@/lib/games/slidingPuzzle';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function SlidingPuzzleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [board, setBoard] = useState<number[]>(() => createSolvablePuzzle());
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle timer tick
  useEffect(() => {
    if (isPlaying && !isSolved) {
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
  }, [isPlaying, isSolved]);

  const handleRestart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setBoard(createSolvablePuzzle());
    setMoves(0);
    setSeconds(0);
    setIsPlaying(false);
    setIsSolved(false);
  }, []);

  const handleTilePress = (index: number) => {
    if (isSolved || board[index] === 0) return;

    const result = moveTile(board, index);
    if (result) {
      // Start timer on first move
      if (!isPlaying) {
        setIsPlaying(true);
      }

      const newMoves = moves + 1;
      setBoard(result.newBoard);
      setMoves(newMoves);

      // Check win condition
      if (isPuzzleSolved(result.newBoard)) {
        setIsSolved(true);
        setIsPlaying(false);
      }
    }
  };

  const emptyIndex = board.indexOf(0);

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
          accessibilityLabel="Restart puzzle"
        >
          <Ionicons name="refresh-outline" size={19} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.contentWrap}>
        {/* Title Header */}
        <View style={styles.headerSection}>
          <AppText style={styles.title}>Puzzle</AppText>
          <AppText muted style={styles.subtitle}>
            A slow, soothing puzzle.
          </AppText>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <AppText muted style={styles.statLabel}>
              MOVES
            </AppText>
            <AppText style={styles.statValue}>{moves}</AppText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <AppText muted style={styles.statLabel}>
              TIME
            </AppText>
            <AppText style={styles.statValue}>{formatTimer(seconds)}</AppText>
          </View>
        </View>

        {/* Game Board Container */}
        <View style={styles.boardWrapper}>
          <View style={styles.board}>
            {board.map((tileNumber, index) => {
              const isEmpty = tileNumber === 0;
              const canMove = !isEmpty && !isSolved && isAdjacent(index, emptyIndex);

              if (isEmpty) {
                return <View key={`empty_${index}`} style={styles.emptySlot} />;
              }

              return (
                <Pressable
                  key={`tile_${tileNumber}`}
                  onPress={() => handleTilePress(index)}
                  disabled={!canMove}
                  accessibilityRole="button"
                  accessibilityLabel={`Tile ${tileNumber}${canMove ? ', tap to move' : ''}`}
                  style={({ pressed }) => [
                    styles.tile,
                    canMove && styles.tileMovable,
                    pressed && styles.tilePressed,
                  ]}
                >
                  <AppText style={[styles.tileText, canMove && styles.tileTextMovable]}>
                    {tileNumber}
                  </AppText>
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
            accessibilityLabel="Reset Puzzle"
          >
            <Ionicons name="sparkles-outline" size={16} color={colors.accentDeep} />
            <AppText style={styles.restartBtnText}>New Shuffle</AppText>
          </Pressable>
        </View>
      </View>

      {/* Calm Solved Completion Modal */}
      <Modal visible={isSolved} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="sparkles" size={28} color={colors.accentDeep} />
            </View>

            <AppText style={styles.modalTitle}>You did it.</AppText>
            <AppText muted style={styles.modalSubtitle}>
              “A tiny win for your mind.”
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
                  MOVES
                </AppText>
                <AppText style={styles.modalStatVal}>{moves}</AppText>
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
    paddingHorizontal: spacing.xl,
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
    fontSize: 18,
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
  board: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 2,
  },
  tile: {
    width: '23.4%',
    height: '23.4%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  tileMovable: {
    backgroundColor: colors.white,
    borderColor: 'rgba(192, 139, 122, 0.45)',
  },
  tilePressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: colors.surfacePeach,
  },
  tileText: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.textSecondary,
  },
  tileTextMovable: {
    color: colors.textPrimary,
  },
  emptySlot: {
    width: '23.4%',
    height: '23.4%',
    backgroundColor: 'rgba(74, 59, 52, 0.04)',
    borderRadius: radii.md,
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
    marginBottom: spacing.lg,
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
