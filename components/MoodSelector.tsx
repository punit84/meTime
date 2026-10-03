import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { MoodConfig, MoodId } from '@/lib/types-phase1';

type ItemProps = {
  mood: MoodConfig;
  selected: boolean;
  onSelect: (id: MoodId) => void;
};

function MoodItem({ mood, selected, onSelect }: ItemProps) {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.04 : 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [selected, scale]);

  return (
    <Pressable
      onPress={() => onSelect(mood.id)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${mood.title}. ${mood.description}`}
      style={styles.item}
    >
      <Animated.View
        style={[
          styles.circle,
          {
            backgroundColor: mood.wash,
            borderColor: selected ? mood.accent : 'transparent',
            transform: [{ scale }],
          },
          selected && styles.circleSelected,
        ]}
      >
        <Ionicons
          name={mood.icon}
          size={20}
          color={selected ? mood.accent : colors.icon}
        />
      </Animated.View>
      <AppText
        style={[styles.title, selected && styles.titleSelected]}
        numberOfLines={1}
      >
        {mood.title}
      </AppText>
      <AppText muted style={styles.desc} numberOfLines={2}>
        {mood.description}
      </AppText>
    </Pressable>
  );
}

type Props = {
  moods: MoodConfig[];
  value: MoodId | null;
  onChange: (id: MoodId) => void;
};

export function MoodSelector({ moods, value, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {moods.map((mood) => (
        <MoodItem
          key={mood.id}
          mood={mood}
          selected={value === mood.id}
          onSelect={onChange}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  circle: {
    width: '100%',
    maxWidth: 54,
    aspectRatio: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  circleSelected: {
    borderWidth: 2,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  titleSelected: {
    fontFamily: fonts.bodySemi,
  },
  desc: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    minHeight: 26,
  },
});
