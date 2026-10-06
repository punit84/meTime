import { useEffect, useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { MoodType } from '@/lib/types';

const MOODS: { type: MoodType; label: string; icon: string; bg: string }[] = [
  { type: 'glow', label: 'Glow', icon: 'sparkles-outline', bg: colors.surfacePeach },
  { type: 'happy', label: 'Happy', icon: 'sunny-outline', bg: colors.surfaceWarm },
  { type: 'calm', label: 'Calm', icon: 'leaf-outline', bg: colors.surfaceSage },
  { type: 'uneasy', label: 'Uneasy', icon: 'cloudy-outline', bg: colors.surfaceLavender },
  { type: 'sad', label: 'Sad', icon: 'rainy-outline', bg: colors.surfaceRose },
];

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function JournalEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const {
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    addJournalPhoto,
    saveJournalDraft,
    getJournalDraft,
    clearJournalDraft,
  } = useApp();

  const editId = params.id;
  const existingEntry = editId ? journalEntries.find((e) => e.id === editId) : null;

  const [title, setTitle] = useState(existingEntry?.title || '');
  const [content, setContent] = useState(existingEntry?.content || '');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(existingEntry?.mood || null);
  const [photoUris, setPhotoUris] = useState<string[]>(existingEntry?.photos?.map((p) => p.uri) || []);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!!existingEntry);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft if creating a new entry
  useEffect(() => {
    if (editId) return;

    let isMounted = true;
    getJournalDraft().then((draft) => {
      if (!isMounted) return;
      if (draft && (draft.title || draft.content || draft.photoUris?.length)) {
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setSelectedMood(draft.mood || null);
        setPhotoUris(draft.photoUris || []);
      }
      setLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, [editId, getJournalDraft]);

  // Auto-save draft on changes (when not editing an existing entry)
  useEffect(() => {
    if (!loaded || editId) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (title.trim() || content.trim() || photoUris.length > 0) {
        saveJournalDraft({
          title,
          content,
          mood: selectedMood,
          photoUris,
        }).catch(() => {});
      }
    }, 800);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [title, content, selectedMood, photoUris, loaded, editId, saveJournalDraft]);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Access',
          'Please allow photo library access to attach handwritten pages or poems to your journal.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((a) => a.uri).filter(Boolean);
        setPhotoUris((prev) => [...prev, ...newUris]);
      }
    } catch (err) {
      if (__DEV__) console.warn('[Journal] Photo pick failed:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Access Needed',
          'Please allow camera access to photograph your journal pages or poems.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotoUris((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (err) {
      if (__DEV__) console.warn('[Journal] Camera take photo failed:', err);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotoUris((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async () => {
    if (!content.trim() && photoUris.length === 0) {
      Alert.alert('Empty Journal Page', 'Write a thought or attach a photo before saving.');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        // Save new photos first if any
        const newPhotoIds: string[] = [];
        for (const uri of photoUris) {
          // Check if photo is already an existing photo
          const existingPhoto = existingEntry?.photos?.find((p) => p.uri === uri);
          if (existingPhoto) {
            newPhotoIds.push(existingPhoto.id);
          } else {
            const savedPhoto = await addJournalPhoto({ uri, entryId: editId });
            newPhotoIds.push(savedPhoto.id);
          }
        }

        await updateJournalEntry(editId, {
          title: title.trim() || null,
          content: content.trim(),
          mood: selectedMood,
          photoIds: newPhotoIds,
        });
      } else {
        // Create new entry
        const entry = await addJournalEntry({
          title: title.trim() || null,
          content: content.trim(),
          mood: selectedMood,
        });

        // Save photos linked to entry
        for (const uri of photoUris) {
          await addJournalPhoto({ uri, entryId: entry.id });
        }

        await clearJournalDraft();
      }

      router.replace('/write/entries');
    } catch (err) {
      if (__DEV__) console.warn('[Journal] Save failed:', err);
      Alert.alert('Save Failed', 'Could not save your journal page. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() || title.trim()) {
      if (Platform.OS === 'web') {
        router.back();
      } else {
        Alert.alert(
          'Leave Editor?',
          'Your draft is automatically saved so you won’t lose your words.',
          [
            { text: 'Keep Writing', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => router.back() },
          ],
        );
      }
    } else {
      router.back();
    }
  };

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top App Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Close journal editor"
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.tagBadge}>
            <AppText style={styles.tagText}>
              {editId ? 'EDIT PAGE' : 'PRIVATE JOURNAL'}
            </AppText>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving || (!content.trim() && photoUris.length === 0)}
            style={({ pressed }) => [
              styles.saveBtn,
              (saving || (!content.trim() && photoUris.length === 0)) && styles.saveBtnDisabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save journal page"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <AppText style={styles.saveBtnText}>Save</AppText>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date Stamp */}
          <AppText muted style={styles.dateStamp}>
            {formatDate(existingEntry?.createdAt || new Date().toISOString())}
          </AppText>

          {/* Title Input */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="A title, or leave it blank…"
            placeholderTextColor={colors.textMuted}
            style={styles.titleInput}
            maxLength={120}
            returnKeyType="next"
          />

          <View style={styles.titleDivider} />

          {/* Body Content Input */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write freely here… unspoken thoughts, a poem, a memory, or how you felt today."
            placeholderTextColor={colors.textMuted}
            style={styles.contentInput}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />

          {/* Attached Photos Gallery */}
          {photoUris.length > 0 && (
            <View style={styles.photosSection}>
              <AppText muted style={styles.sectionLabel}>
                ATTACHED KEEPSAKES & PAGES ({photoUris.length})
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                {photoUris.map((uri, idx) => (
                  <View key={`${uri}-${idx}`} style={styles.photoThumbWrap}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <Pressable
                      onPress={() => handleRemovePhoto(idx)}
                      style={({ pressed }) => [styles.photoRemoveBtn, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                    >
                      <Ionicons name="close" size={14} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Bottom Toolbar: Mood & Photo Attachment */}
          <View style={styles.toolbarCard}>
            {/* Mood Selector Header */}
            <View style={styles.toolbarSectionHeader}>
              <AppText muted style={styles.sectionLabel}>
                HOW ARE YOU FEELING? (OPTIONAL)
              </AppText>
              {selectedMood && (
                <Pressable onPress={() => setSelectedMood(null)}>
                  <AppText style={styles.clearMoodText}>Clear</AppText>
                </Pressable>
              )}
            </View>

            {/* Mood Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow}>
              {MOODS.map((m) => {
                const active = selectedMood === m.type;
                return (
                  <Pressable
                    key={m.type}
                    onPress={() => setSelectedMood(active ? null : m.type)}
                    style={({ pressed }) => [
                      styles.moodPill,
                      active && styles.moodPillActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name={m.icon as unknown as never}
                      size={14}
                      color={active ? colors.textPrimary : colors.textMuted}
                    />
                    <AppText
                      style={[
                        styles.moodPillText,
                        active && styles.moodPillTextActive,
                      ]}
                    >
                      {m.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.toolbarDivider} />

            {/* Attach Photo Buttons */}
            <View style={styles.photoActionsRow}>
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [styles.photoActionBtn, pressed && styles.pressed]}
              >
                <Ionicons name="camera-outline" size={18} color={colors.accentDeep} />
                <AppText style={styles.photoActionText}>Photograph Page</AppText>
              </Pressable>

              <Pressable
                onPress={handlePickImage}
                style={({ pressed }) => [styles.photoActionBtn, pressed && styles.pressed]}
              >
                <Ionicons name="images-outline" size={18} color={colors.accentDeep} />
                <AppText style={styles.photoActionText}>Choose Photo</AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
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
  dateStamp: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    color: colors.textMuted,
  },
  titleInput: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  titleDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  contentInput: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
    color: colors.textPrimary,
    minHeight: 220,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  photosSection: {
    marginVertical: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  photoRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  photoThumbWrap: {
    width: 100,
    height: 100,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginRight: spacing.sm,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xl,
    ...shadows.soft,
  },
  toolbarSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  clearMoodText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.accentDeep,
  },
  moodRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  moodPillActive: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.accentDeep,
  },
  moodPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  moodPillTextActive: {
    color: colors.textPrimary,
  },
  toolbarDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoActionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.accentDeep,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
