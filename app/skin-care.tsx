import { useCallback, useMemo } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import {
  CATEGORY_ICONS,
  periodProgress,
  stepsForPeriod,
} from '@/lib/skinCare';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { SkinCarePeriod, SkinCareStep } from '@/lib/types';

function StepRow({
  step,
  completed,
  onToggle,
  onEdit,
}: {
  step: SkinCareStep;
  completed: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <View style={[styles.stepRow, completed && styles.stepRowDone]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.checkBtn, pressed && styles.pressed]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={`${completed ? 'Unmark' : 'Mark'} ${step.name}`}
      >
        <Ionicons
          name={completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={completed ? colors.accentDeep : colors.textMuted}
        />
      </Pressable>

      <Pressable
        onPress={onEdit}
        style={({ pressed }) => [styles.stepCopy, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${step.name}`}
      >
        <View style={styles.stepTitleRow}>
          <Ionicons
            name={CATEGORY_ICONS[step.category]}
            size={13}
            color={colors.textMuted}
          />
          <AppText
            style={[styles.stepName, completed && styles.stepNameDone]}
            numberOfLines={1}
          >
            {step.name}
          </AppText>
        </View>
        {!!step.productName && (
          <AppText muted style={styles.stepProduct} numberOfLines={1}>
            {step.productName}
          </AppText>
        )}
        {!!step.notes && (
          <AppText muted style={styles.stepNotes} numberOfLines={2}>
            {step.notes}
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

function RitualCard({
  title,
  steps,
  completedIds,
  period,
  onToggle,
  onAdd,
  onEdit,
  onMove,
}: {
  title: string;
  steps: SkinCareStep[];
  completedIds: string[];
  period: SkinCarePeriod;
  onToggle: (id: string) => void;
  onAdd: () => void;
  onEdit: (step: SkinCareStep) => void;
  onMove: (stepId: string, direction: -1 | 1) => void;
}) {
  const total = steps.length;
  const completed = steps.filter((s) => completedIds.includes(s.id)).length;
  const done = total > 0 && completed >= total;

  return (
    <View style={styles.ritualCard}>
      <View style={styles.ritualHeader}>
        <View style={styles.ritualTitleWrap}>
          <AppText style={styles.ritualTitle}>{title}</AppText>
          <AppText muted style={styles.ritualMeta}>
            {total === 0
              ? 'No steps yet'
              : done
                ? period === 'morning'
                  ? 'You’re done for this morning.'
                  : 'You’re done for tonight.'
                : `${completed}/${total}`}
          </AppText>
        </View>
        {done && (
          <View style={styles.donePill}>
            <Ionicons name="checkmark" size={12} color={colors.accentDeep} />
            <AppText style={styles.donePillText}>Done</AppText>
          </View>
        )}
      </View>

      {steps.length === 0 ? (
        <AppText muted style={styles.emptyRitual}>
          Add a soft step whenever you’re ready.
        </AppText>
      ) : (
        <View style={styles.stepList}>
          {steps.map((step, index) => (
            <View key={step.id}>
              <StepRow
                step={step}
                completed={completedIds.includes(step.id)}
                onToggle={() => onToggle(step.id)}
                onEdit={() => onEdit(step)}
              />
              {steps.length > 1 && (
                <View style={styles.reorderRow}>
                  <Pressable
                    onPress={() => onMove(step.id, -1)}
                    disabled={index === 0}
                    style={({ pressed }) => [
                      styles.reorderBtn,
                      index === 0 && styles.reorderDisabled,
                      pressed && styles.pressed,
                    ]}
                    accessibilityLabel="Move step up"
                  >
                    <Ionicons
                      name="chevron-up"
                      size={14}
                      color={index === 0 ? colors.borderStrong : colors.textMuted}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => onMove(step.id, 1)}
                    disabled={index === steps.length - 1}
                    style={({ pressed }) => [
                      styles.reorderBtn,
                      index === steps.length - 1 && styles.reorderDisabled,
                      pressed && styles.pressed,
                    ]}
                    accessibilityLabel="Move step down"
                  >
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={
                        index === steps.length - 1
                          ? colors.borderStrong
                          : colors.textMuted
                      }
                    />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.addStepBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Add ${period} step`}
      >
        <Ionicons name="add" size={16} color={colors.accentDeep} />
        <AppText style={styles.addStepText}>Add step</AppText>
      </Pressable>
    </View>
  );
}

export default function SkinCareScreen() {
  const router = useRouter();
  const {
    skinCareRoutine,
    skinCareToday,
    createSkinCareRoutine,
    toggleSkinCareStep,
    reorderSkinCareSteps,
    resetTodaySkinCare,
    refreshSkinCareDay,
  } = useApp();

  useFocusEffect(
    useCallback(() => {
      refreshSkinCareDay().catch(() => {});
    }, [refreshSkinCareDay]),
  );

  const configured = skinCareRoutine.configured && skinCareRoutine.steps.length > 0;
  const completedIds = skinCareToday.completedStepIds;

  const morningSteps = useMemo(
    () => stepsForPeriod(skinCareRoutine.steps, 'morning'),
    [skinCareRoutine.steps],
  );
  const eveningSteps = useMemo(
    () => stepsForPeriod(skinCareRoutine.steps, 'evening'),
    [skinCareRoutine.steps],
  );

  const morning = useMemo(
    () => periodProgress(skinCareRoutine.steps, completedIds, 'morning'),
    [skinCareRoutine.steps, completedIds],
  );
  const evening = useMemo(
    () => periodProgress(skinCareRoutine.steps, completedIds, 'evening'),
    [skinCareRoutine.steps, completedIds],
  );

  const handleMove = async (
    period: SkinCarePeriod,
    stepId: string,
    direction: -1 | 1,
  ) => {
    const steps = stepsForPeriod(skinCareRoutine.steps, period);
    const index = steps.findIndex((s) => s.id === stepId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= steps.length) return;
    const ids = steps.map((s) => s.id);
    const tmp = ids[index];
    ids[index] = ids[target];
    ids[target] = tmp;
    await reorderSkinCareSteps(period, ids);
  };

  const handleResetToday = () => {
    Alert.alert(
      'Clear today’s checkmarks?',
      'Your ritual stays. Only today’s completions will reset.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            resetTodaySkinCare().catch(() => {});
          },
        },
      ],
    );
  };

  if (!configured) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <AppText variant="title" style={styles.title}>
          Skin Care
        </AppText>
        <AppText muted style={styles.subtitle}>
          A little care, every day.
        </AppText>

        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="sparkles-outline" size={22} color={colors.accentDeep} />
          </View>
          <AppText style={styles.emptyTitle}>Build your routine</AppText>
          <AppText muted style={styles.emptyBody}>
            Create a simple routine that feels good to come back to.
          </AppText>
          <Pressable
            onPress={() => {
              createSkinCareRoutine().catch(() => {});
            }}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Create Routine"
          >
            <AppText style={styles.primaryBtnText}>Create Routine</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.topActions}>
          <Pressable
            onPress={() => router.push('/skin-care/history')}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="View history"
          >
            <Ionicons name="calendar-outline" size={18} color={colors.icon} />
          </Pressable>
          <Pressable
            onPress={handleResetToday}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Clear today’s checkmarks"
          >
            <Ionicons name="refresh-outline" size={18} color={colors.icon} />
          </Pressable>
        </View>
      </View>

      <AppText variant="title" style={styles.title}>
        Skin Care
      </AppText>
      <AppText muted style={styles.subtitle}>
        A little care, every day.
      </AppText>

      {/* Today progress */}
      <View style={styles.todayCard}>
        <AppText variant="label" style={styles.todayLabel}>
          Today
        </AppText>
        <View style={styles.todayRows}>
          <View style={styles.todayRow}>
            <AppText style={styles.todayPeriod}>Morning</AppText>
            <AppText style={styles.todayCount}>
              {morning.total === 0
                ? '—'
                : `${morning.completed}/${morning.total}${morning.done ? ' ✓' : ''}`}
            </AppText>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    morning.total === 0
                      ? '0%'
                      : `${Math.round((morning.completed / morning.total) * 100)}%`,
                },
              ]}
            />
          </View>
          <View style={[styles.todayRow, { marginTop: spacing.md }]}>
            <AppText style={styles.todayPeriod}>Evening</AppText>
            <AppText style={styles.todayCount}>
              {evening.total === 0
                ? '—'
                : `${evening.completed}/${evening.total}${evening.done ? ' ✓' : ''}`}
            </AppText>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    evening.total === 0
                      ? '0%'
                      : `${Math.round((evening.completed / evening.total) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <RitualCard
        period="morning"
        title="Your morning ritual"
        steps={morningSteps}
        completedIds={completedIds}
        onToggle={(id) => {
          toggleSkinCareStep(id).catch(() => {});
        }}
        onAdd={() =>
          router.push({
            pathname: '/skin-care/edit',
            params: { period: 'morning' },
          })
        }
        onEdit={(step) =>
          router.push({
            pathname: '/skin-care/edit',
            params: { stepId: step.id },
          })
        }
        onMove={(stepId, direction) => {
          handleMove('morning', stepId, direction).catch(() => {});
        }}
      />

      <RitualCard
        period="evening"
        title="Your evening ritual"
        steps={eveningSteps}
        completedIds={completedIds}
        onToggle={(id) => {
          toggleSkinCareStep(id).catch(() => {});
        }}
        onAdd={() =>
          router.push({
            pathname: '/skin-care/edit',
            params: { period: 'evening' },
          })
        }
        onEdit={(step) =>
          router.push({
            pathname: '/skin-care/edit',
            params: { stepId: step.id },
          })
        }
        onMove={(stepId, direction) => {
          handleMove('evening', stepId, direction).catch(() => {});
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  todayLabel: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  todayRows: {},
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  todayPeriod: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
  },
  todayCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceWarm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  ritualCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  ritualHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  ritualTitleWrap: {
    flex: 1,
  },
  ritualTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  ritualMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  donePillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.accentDeep,
  },
  emptyRitual: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  stepList: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceWarm,
  },
  stepRowDone: {
    backgroundColor: colors.surfaceSage,
  },
  checkBtn: {
    paddingTop: 2,
  },
  stepCopy: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepName: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  stepNameDone: {
    color: colors.accentDeep,
  },
  stepProduct: {
    fontSize: 13,
    marginTop: 2,
    marginLeft: 19,
  },
  stepNotes: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 19,
    fontStyle: 'italic',
  },
  reorderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
    marginBottom: 2,
  },
  reorderBtn: {
    width: 28,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderDisabled: {
    opacity: 0.35,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  addStepText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.accentDeep,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.soft,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    backgroundColor: colors.selected,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  primaryBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
