import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { WriteCameraModal } from '@/components/WriteCameraModal';
import { useApp } from '@/lib/AppProvider';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

export default function AddJournalPhotoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addJournalPhoto, addJournalEntry } = useApp();

  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [createAsEntry, setCreateAsEntry] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleTakePhoto = () => {
    setCameraOpen(true);
  };

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Access',
          'Please allow photo library access to choose a photo for your journal.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.88,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setSelectedUri(result.assets[0].uri);
      }
    } catch (err) {
      if (__DEV__) console.warn('[JournalPhoto] Pick failed:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedUri || saving) return;
    setSaving(true);

    try {
      if (createAsEntry) {
        // Save as a journal entry with attached photo
        const entry = await addJournalEntry({
          title: caption.trim() || 'Keepsake Photo',
          content: caption.trim() ? caption.trim() : 'Preserved page from my journal.',
        });

        await addJournalPhoto({
          uri: selectedUri,
          caption: caption.trim() || null,
          entryId: entry.id,
        });
      } else {
        // Save as standalone journal photo
        await addJournalPhoto({
          uri: selectedUri,
          caption: caption.trim() || null,
        });
      }

      router.replace('/write/entries');
    } catch (err) {
      if (__DEV__) console.warn('[JournalPhoto] Save failed:', err);
      Alert.alert('Save Failed', 'Could not save this photo to your journal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.tagBadge}>
            <AppText style={styles.tagText}>JOURNAL KEEPSAKE</AppText>
          </View>

          {selectedUri ? (
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.saveBtn,
                saving && styles.saveBtnDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save photo to Journal"
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <AppText style={styles.saveBtnText}>Save</AppText>
              )}
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Title */}
          <View style={styles.titleSection}>
            <AppText style={styles.title}>Preserve a Page</AppText>
            <AppText muted style={styles.subtitle}>
              Keep handwritten shayari, poetry, a meaningful letter, a sketch, or an affirmation safely in your journal.
            </AppText>
          </View>

          {/* Photo Display / Selector */}
          {selectedUri ? (
            <View style={styles.previewContainer}>
              <View style={styles.previewCard}>
                <Image source={{ uri: selectedUri }} style={styles.previewImage} />
                <Pressable
                  onPress={() => setSelectedUri(null)}
                  style={({ pressed }) => [styles.changeBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Choose another photo"
                >
                  <Ionicons name="refresh" size={16} color={colors.white} />
                  <AppText style={styles.changeBtnText}>Choose Another</AppText>
                </Pressable>
              </View>

              {/* Caption Input */}
              <View style={styles.captionCard}>
                <AppText muted style={styles.captionLabel}>
                  NOTE OR CAPTION (OPTIONAL)
                </AppText>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="e.g. Something I wrote when I couldn’t explain how I felt."
                  placeholderTextColor={colors.textMuted}
                  style={styles.captionInput}
                  multiline
                  maxLength={250}
                />
              </View>

              {/* Checkbox: Create page in My Entries */}
              <Pressable
                onPress={() => setCreateAsEntry(!createAsEntry)}
                style={styles.optionRow}
              >
                <View style={[styles.checkbox, createAsEntry && styles.checkboxActive]}>
                  {createAsEntry && <Ionicons name="checkmark" size={14} color={colors.white} />}
                </View>
                <View style={styles.optionTextWrap}>
                  <AppText style={styles.optionTitle}>Add as a Journal Page</AppText>
                  <AppText muted style={styles.optionSub}>
                    Appears with your written entries in My Entries
                  </AppText>
                </View>
              </Pressable>

              {/* Primary Save Button */}
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [
                  styles.primarySaveBtn,
                  saving && styles.saveBtnDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <AppText style={styles.primarySaveBtnText}>Save to My Journal</AppText>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.pickerOptionsContainer}>
              {/* Option 1: Photograph Page */}
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [styles.pickerCard, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Photograph a Page with camera"
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.surfaceWarm }]}>
                  <Ionicons name="camera-outline" size={30} color={colors.accentDeep} />
                </View>
                <AppText style={styles.pickerCardTitle}>Photograph a Page</AppText>
                <AppText muted style={styles.pickerCardSub}>
                  Take a clear photo of your diary, poetry, or handwritten thought right now.
                </AppText>
              </Pressable>

              {/* Option 2: Choose from Photos */}
              <Pressable
                onPress={handlePickPhoto}
                style={({ pressed }) => [styles.pickerCard, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Choose from Photos"
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.surfacePeach }]}>
                  <Ionicons name="images-outline" size={30} color={colors.accentDeep} />
                </View>
                <AppText style={styles.pickerCardTitle}>Choose from Photos</AppText>
                <AppText muted style={styles.pickerCardSub}>
                  Pick an existing photo or page from your photo library.
                </AppText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <WriteCameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(uri) => {
          setSelectedUri(uri);
          setCameraOpen(false);
        }}
        title="Photograph a Page"
        subtitle="Hold steady to capture your diary, poetry, or handwritten thought"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    ...shadows.soft,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    lineHeight: 34,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  pickerOptionsContainer: {
    gap: spacing.md,
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.soft,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pickerCardTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pickerCardSub: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 260,
  },
  previewContainer: {
    gap: spacing.lg,
  },
  previewCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...shadows.soft,
  },
  previewImage: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
  },
  changeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  changeBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.white,
  },
  captionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  captionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: spacing.xs,
  },
  captionInput: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    minHeight: 60,
    paddingVertical: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxActive: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.textPrimary,
  },
  optionSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  primarySaveBtn: {
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  primarySaveBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
