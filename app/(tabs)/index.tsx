import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { HomeHero } from '@/components/HomeHero';
import { MoodSelector } from '@/components/MoodSelector';
import { NeedSection } from '@/components/NeedSection';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { MOODS } from '@/lib/moods';
import { NEEDS } from '@/lib/needs';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { MoodId } from '@/lib/types-phase1';

export default function HomeScreen() {
  const { user, todayMood, selectMood } = useApp();
  const [fade] = useState(() => new Animated.Value(0));

  // Map stored MoodType to MoodId for the selector
  const currentMoodId: MoodId | null = todayMood
    ? (todayMood.mood as MoodId)
    : null;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const handleMoodChange = (moodId: MoodId) => {
    selectMood(moodId);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Animated.View style={{ opacity: fade }}>
        <HomeHero name={user.name || undefined} />

        <AppText variant="label" style={styles.sectionLabel}>
          How are you feeling today?
        </AppText>
        <MoodSelector
          moods={MOODS}
          value={currentMoodId}
          onChange={handleMoodChange}
        />

        <View style={styles.message} accessibilityRole="text">
          <AppText style={styles.messageLine}>
            Every feeling is allowed here.
          </AppText>
          <AppText muted style={styles.messageSub}>
            This is your little space.
          </AppText>
        </View>

        <AppText variant="label" style={styles.sectionLabel}>
          What do you need right now?
        </AppText>
        <NeedSection needs={NEEDS} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  message: {
    marginTop: spacing.section,
    marginBottom: spacing.section,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.sm,
  },
  messageLine: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  messageSub: {
    marginTop: 4,
    fontSize: 13,
  },
});
