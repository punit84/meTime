import { useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, changeName } = useApp();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= 40;
  const hasChanged = trimmed !== user.name;

  const handleSave = async () => {
    if (!isValid || !hasChanged || saving) return;

    Keyboard.dismiss();
    setSaving(true);

    try {
      await changeName(trimmed);
      router.back();
    } catch {
      Alert.alert('Oops', 'Could not save your name. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="section">Profile</AppText>
        <View style={styles.spacer} />
      </View>

      {/* Avatar placeholder */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarLetter}>
            {trimmed ? trimmed[0].toUpperCase() : '♡'}
          </AppText>
        </View>
      </View>

      {/* Name field */}
      <AppText style={styles.label}>Name</AppText>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        accessibilityLabel="Your name"
      />

      {/* Member since */}
      {user.createdAt ? (
        <AppText muted style={styles.memberSince}>
          Member since{' '}
          {new Date(user.createdAt).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </AppText>
      ) : null}

      {/* Save button */}
      <Pressable
        onPress={handleSave}
        disabled={!isValid || !hasChanged || saving}
        accessibilityRole="button"
        accessibilityLabel="Save profile"
        accessibilityState={{ disabled: !isValid || !hasChanged || saving }}
        style={({ pressed }) => [
          styles.saveBtn,
          (!isValid || !hasChanged || saving) && styles.saveBtnDisabled,
          pressed && isValid && hasChanged && !saving && styles.pressed,
        ]}
      >
        <AppText
          style={[
            styles.saveBtnText,
            (!isValid || !hasChanged || saving) && styles.saveBtnTextDisabled,
          ]}
        >
          {saving ? 'Saving…' : 'Save'}
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { width: 40 },
  pressed: { opacity: 0.88 },

  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  avatarLetter: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    color: colors.accentDeep,
  },

  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  memberSince: {
    fontSize: 12,
    marginBottom: spacing.xl,
  },

  saveBtn: {
    width: '100%',
    height: 52,
    backgroundColor: colors.selected,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceWarm,
  },
  saveBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.white,
  },
  saveBtnTextDisabled: {
    color: colors.textMuted,
  },
});
