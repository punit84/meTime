import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/components/SettingsRow';
import { useApp } from '@/lib/AppProvider';
import { clearAllData } from '@/lib/storage';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, preferences, updatePreferences } = useApp();

  const handleNotificationsToggle = async (val: boolean) => {
    await updatePreferences({
      ...preferences,
      notificationsEnabled: val,
    });
  };

  const handleAppearanceCycle = () => {
    Alert.alert(
      'Appearance Mode',
      `Current: ${preferences.appearance.toUpperCase()}\n\nSwitch to:`,
      [
        { text: 'System', onPress: () => updatePreferences({ ...preferences, appearance: 'system' }) },
        { text: 'Light', onPress: () => updatePreferences({ ...preferences, appearance: 'light' }) },
        { text: 'Dark', onPress: () => updatePreferences({ ...preferences, appearance: 'dark' }) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Reset All Data',
      'This will reset your profile, mood history, and preferences. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Reset Complete', 'Please reload the app to start fresh.');
          },
        },
      ],
    );
  };

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'M';
  const memberYear = user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

  return (
    <Screen>
      <PageHeader
        title="Settings"
        subtitle="Keep this space gentle, private, and yours."
      />

      {/* User Profile Card */}
      <Pressable
        style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
        onPress={() => router.push('/profile')}
        accessibilityRole="button"
        accessibilityLabel={`Profile for ${user.name || 'Friend'}. Tap to edit.`}
      >
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{initial}</AppText>
        </View>
        <View style={styles.profileInfo}>
          <AppText style={styles.profileName}>
            {user.name || 'Dear Friend'}
          </AppText>
          <AppText muted style={styles.profileMeta}>
            Personal sanctuary · Since {memberYear}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <AppText muted style={styles.sectionHeader}>PREFERENCES</AppText>

      {/* Profile Row */}
      <SettingsRow
        item={{
          id: 'profile',
          title: 'Profile Name',
          subtitle: user.name ? user.name : 'Set your name',
          icon: 'person-outline',
        }}
        onPress={() => router.push('/profile')}
      />

      {/* Notifications Row */}
      <View style={styles.switchRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications-outline" size={18} color={colors.icon} />
        </View>
        <View style={styles.switchCopy}>
          <AppText style={styles.rowTitle}>Notifications</AppText>
          <AppText muted style={styles.rowSubtitle}>
            Gentle reminders only
          </AppText>
        </View>
        <Switch
          value={preferences.notificationsEnabled}
          onValueChange={handleNotificationsToggle}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.white}
        />
      </View>

      {/* Appearance Row */}
      <SettingsRow
        item={{
          id: 'appearance',
          title: 'Appearance',
          subtitle: `Current theme: ${preferences.appearance.charAt(0).toUpperCase() + preferences.appearance.slice(1)}`,
          icon: 'color-palette-outline',
        }}
        onPress={handleAppearanceCycle}
      />

      <AppText muted style={styles.sectionHeader}>PRIVACY & CARE</AppText>

      {/* App Lock Row */}
      <SettingsRow
        item={{
          id: 'lock',
          title: 'App Lock',
          subtitle: 'Keep this space private and secure',
          icon: 'lock-closed-outline',
        }}
        onPress={() =>
          Alert.alert(
            'App Lock',
            'Me Time is kept locally on your device. Biometric and passcode lock will be available in an upcoming release.',
          )
        }
      />

      {/* Help & Support */}
      <SettingsRow
        item={{
          id: 'help',
          title: 'Help & Support',
          subtitle: 'We’re here if you need us',
          icon: 'help-circle-outline',
        }}
        onPress={() =>
          Alert.alert(
            'Me Time Sanctuary',
            'This app is your gentle private space. Your data never leaves your device.\n\nTake your time and breathe.',
          )
        }
      />

      {/* About */}
      <SettingsRow
        item={{
          id: 'about',
          title: 'About',
          subtitle: 'Me Time v1.0.0 · Private & Offline',
          icon: 'information-circle-outline',
        }}
        onPress={() =>
          Alert.alert(
            'About Me Time',
            'Version 1.0.0\n\nA warm, private sanctuary for quiet reflection, soft journaling, and everyday presence.',
          )
        }
      />

      {/* Dev Reset */}
      {__DEV__ && (
        <Pressable
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          onPress={handleClearData}
        >
          <Ionicons name="trash-outline" size={16} color={colors.accentDeep} />
          <AppText style={styles.resetText}>Reset All Local Data (Dev)</AppText>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceRose,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  avatarText: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.accent,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.textPrimary,
  },
  profileMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchCopy: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLavender,
  },
  resetText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.accentDeep,
  },
  pressed: {
    opacity: 0.85,
  },
});
