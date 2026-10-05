import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/skinCare';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import {
  SKIN_CARE_CATEGORIES,
  type SkinCareCategory,
  type SkinCarePeriod,
} from '@/lib/types';

function parsePeriod(value: unknown): SkinCarePeriod {
  return value === 'evening' ? 'evening' : 'morning';
}

export default function SkinCareEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ stepId?: string; period?: string }>();
  const {
    skinCareRoutine,
    addSkinCareStep,
    updateSkinCareStep,
    deleteSkinCareStep,
  } = useApp();

  const existing = useMemo(
    () =>
      typeof params.stepId === 'string'
        ? skinCareRoutine.steps.find((s) => s.id === params.stepId)
        : undefined,
    [params.stepId, skinCareRoutine.steps],
  );

  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [productName, setProductName] = useState(existing?.productName ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [period, setPeriod] = useState<SkinCarePeriod>(
    existing?.period ?? parsePeriod(params.period),
  );
  const [category, setCategory] = useState<SkinCareCategory>(
    existing?.category ?? 'cleanser',
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Step name', 'Give this step a gentle name.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && existing) {
        await updateSkinCareStep(existing.id, {
          name: trimmed,
          productName: productName.trim() || null,
          notes: notes.trim() || null,
          period,
          category,
        });
      } else {
        await addSkinCareStep({
          name: trimmed,
          productName: productName.trim() || null,
          notes: notes.trim() || null,
          period,
          category,
        });
      }
      router.back();
    } catch (error) {
      if (__DEV__) console.warn('[SkinCare] Save failed:', error);
      Alert.alert('Something went soft', 'Couldn’t save that step. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert(
      'Remove this step?',
      'It will leave your ritual. Today’s checkmark for it will clear too.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteSkinCareStep(existing.id);
            router.back();
          },
        },
      ],
    );
  };

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
        {isEditing && (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Remove step"
          >
            <Ionicons name="trash-outline" size={18} color={colors.accentDeep} />
          </Pressable>
        )}
      </View>

      <AppText variant="title" style={styles.title}>
        {isEditing ? 'Edit step' : 'Add a step'}
      </AppText>
      <AppText muted style={styles.subtitle}>
        Keep it simple. Product details are optional.
      </AppText>

      <AppText muted style={styles.fieldLabel}>
        Ritual
      </AppText>
      <View style={styles.segmentRow}>
        {([
          { id: 'morning' as const, label: 'Morning' },
          { id: 'evening' as const, label: 'Evening' },
        ]).map((option) => {
          const active = period === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => setPeriod(option.id)}
              style={({ pressed }) => [
                styles.segment,
                active && styles.segmentActive,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={[styles.segmentText, active && styles.segmentTextActive]}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText muted style={styles.fieldLabel}>
        Step name
      </AppText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Cleanser"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        maxLength={48}
      />

      <AppText muted style={styles.fieldLabel}>
        Product name (optional)
      </AppText>
      <TextInput
        value={productName}
        onChangeText={setProductName}
        placeholder="e.g. Gentle Cleanser"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        maxLength={64}
      />

      <AppText muted style={styles.fieldLabel}>
        Notes (optional)
      </AppText>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="A soft reminder for yourself"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.notesInput]}
        multiline
        maxLength={160}
      />

      <AppText muted style={styles.fieldLabel}>
        Category
      </AppText>
      <View style={styles.categoryGrid}>
        {SKIN_CARE_CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={({ pressed }) => [
                styles.categoryChip,
                active && styles.categoryChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={CATEGORY_ICONS[cat]}
                size={14}
                color={active ? colors.white : colors.icon}
              />
              <AppText
                style={[
                  styles.categoryText,
                  active && styles.categoryTextActive,
                ]}
              >
                {CATEGORY_LABELS[cat]}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveBtn,
          saving && styles.saveDisabled,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isEditing ? 'Save step' : 'Add step'}
      >
        <AppText style={styles.saveText}>
          {saving ? 'Saving…' : isEditing ? 'Save step' : 'Add to ritual'}
        </AppText>
      </Pressable>
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
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRose,
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
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  segmentText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  segmentTextActive: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  categoryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  categoryTextActive: {
    color: colors.white,
  },
  saveBtn: {
    backgroundColor: colors.selected,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.soft,
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
