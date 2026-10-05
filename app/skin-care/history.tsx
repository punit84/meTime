import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import {
  dayCompletionPercent,
  historyDayLabel,
  localDateKey,
} from '@/lib/skinCare';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { SkinCareDayRecord } from '@/lib/types';

export default function SkinCareHistoryScreen() {
  const router = useRouter();
  const { skinCareRoutine, skinCareToday, skinCareHistory } = useApp();

  const rows = useMemo(() => {
    const byDate = new Map<string, SkinCareDayRecord>();
    for (const record of skinCareHistory) {
      byDate.set(record.date, record);
    }
    // Prefer live today record
    byDate.set(skinCareToday.date, skinCareToday);

    return Array.from(byDate.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);
  }, [skinCareHistory, skinCareToday]);

  const stepCount = skinCareRoutine.steps.length;

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
        Care history
      </AppText>
      <AppText muted style={styles.subtitle}>
        A soft look at the days you showed up for yourself.
      </AppText>

      {rows.length === 0 || stepCount === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No history yet."
          subtitle="As you move through your ritual, gentle notes will gather here."
        />
      ) : (
        <View style={styles.list}>
          {rows.map((record) => {
            const percent = dayCompletionPercent(skinCareRoutine.steps, record);
            const isToday = record.date === localDateKey();
            return (
              <View
                key={record.date}
                style={[styles.row, isToday && styles.rowToday]}
              >
                <View style={styles.rowCopy}>
                  <AppText style={styles.rowTitle}>
                    {historyDayLabel(record.date)}
                  </AppText>
                  <AppText muted style={styles.rowMeta}>
                    {record.completedStepIds.filter((id) =>
                      skinCareRoutine.steps.some((s) => s.id === id),
                    ).length}
                    /{stepCount} steps
                  </AppText>
                </View>
                <View style={styles.percentWrap}>
                  <AppText style={styles.percentText}>{percent}%</AppText>
                  <View style={styles.miniTrack}>
                    <View
                      style={[styles.miniFill, { width: `${percent}%` }]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
  },
  rowToday: {
    backgroundColor: colors.surfaceSage,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
  },
  rowMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  percentWrap: {
    width: 72,
    alignItems: 'flex-end',
  },
  percentText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.accentDeep,
    marginBottom: 4,
  },
  miniTrack: {
    width: 64,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceWarm,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.88,
  },
});
