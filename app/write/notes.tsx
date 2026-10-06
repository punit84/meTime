import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useApp } from '@/lib/AppProvider';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { PrivateNote } from '@/lib/types';

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupNotesByDate(notes: PrivateNote[]): { title: string; items: PrivateNote[] }[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const todayItems: PrivateNote[] = [];
  const yesterdayItems: PrivateNote[] = [];
  const earlierItems: PrivateNote[] = [];

  notes.forEach((item) => {
    const itemDate = new Date(item.createdAt).toDateString();
    if (itemDate === todayStr) {
      todayItems.push(item);
    } else if (itemDate === yesterdayStr) {
      yesterdayItems.push(item);
    } else {
      earlierItems.push(item);
    }
  });

  const sections: { title: string; items: PrivateNote[] }[] = [];
  if (todayItems.length > 0) sections.push({ title: 'TODAY', items: todayItems });
  if (yesterdayItems.length > 0) sections.push({ title: 'YESTERDAY', items: yesterdayItems });
  if (earlierItems.length > 0) sections.push({ title: 'EARLIER', items: earlierItems });

  return sections;
}

export default function PrivateNotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { privateNotes, addPrivateNote, updatePrivateNote, deletePrivateNote } = useApp();

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PrivateNote | null>(null);
  const [noteText, setNoteText] = useState('');

  const groupedSections = useMemo(() => {
    return groupNotesByDate(privateNotes);
  }, [privateNotes]);

  const handleOpenNew = () => {
    setEditingNote(null);
    setNoteText('');
    setComposerOpen(true);
  };

  const handleOpenEdit = (note: PrivateNote) => {
    setEditingNote(note);
    setNoteText(note.content);
    setComposerOpen(true);
  };

  const handleSave = async () => {
    if (!noteText.trim()) return;

    if (editingNote) {
      await updatePrivateNote(editingNote.id, noteText.trim());
    } else {
      await addPrivateNote(noteText.trim());
    }

    setComposerOpen(false);
    setEditingNote(null);
    setNoteText('');
  };

  const handleDelete = (note: PrivateNote) => {
    const performDelete = async () => {
      await deletePrivateNote(note.id);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this private note?')) {
        performDelete().catch(() => {});
      }
    } else {
      Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => performDelete() },
      ]);
    }
  };

  return (
    <Screen padded={false} edges={['left', 'right']}>
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.tagBadge}>
          <AppText style={styles.tagText}>PRIVATE NOTES</AppText>
        </View>

        <Pressable
          onPress={handleOpenNew}
          style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Write a private note"
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <AppText style={styles.newBtnText}>New Note</AppText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 32 },
        ]}
      >
        {/* Title */}
        <View style={styles.headerSection}>
          <AppText style={styles.title}>Private Notes</AppText>
          <AppText muted style={styles.subtitle}>
            Quick thoughts, reminders, and small reflections held safely for you.
          </AppText>
        </View>

        {/* Notes List */}
        {privateNotes.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No private notes yet."
            message="Keep the little thoughts that matter."
            actionLabel="Write a Note"
            onAction={handleOpenNew}
          />
        ) : (
          groupedSections.map((section) => (
            <View key={section.title} style={styles.sectionWrap}>
              <AppText muted style={styles.sectionHeader}>
                {section.title}
              </AppText>

              {section.items.map((item) => (
                <View key={item.id} style={styles.noteCard}>
                  <Pressable
                    onPress={() => handleOpenEdit(item)}
                    style={styles.noteContentArea}
                  >
                    <AppText style={styles.noteBody}>{item.content}</AppText>
                    <AppText muted style={styles.noteTime}>
                      {formatTime(item.createdAt)}
                    </AppText>
                  </Pressable>

                  <View style={styles.noteActions}>
                    <Pressable
                      onPress={() => handleOpenEdit(item)}
                      style={({ pressed }) => [styles.iconActionBtn, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Edit note"
                    >
                      <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                    </Pressable>

                    <Pressable
                      onPress={() => handleDelete(item)}
                      style={({ pressed }) => [styles.iconActionBtn, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Delete note"
                    >
                      <Ionicons name="trash-outline" size={16} color="#D9534F" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Note Composer Modal */}
      <Modal
        visible={composerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setComposerOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => setComposerOpen(false)}
                style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={18} color={colors.textPrimary} />
              </Pressable>

              <AppText style={styles.modalTitle}>
                {editingNote ? 'Edit Note' : 'Private Note'}
              </AppText>

              <Pressable
                onPress={handleSave}
                disabled={!noteText.trim()}
                style={({ pressed }) => [
                  styles.saveNoteBtn,
                  !noteText.trim() && styles.saveNoteDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <AppText style={styles.saveNoteBtnText}>Save</AppText>
              </Pressable>
            </View>

            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="A quiet thought, reminder, or line for yourself…"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
              multiline
              autoFocus
              textAlignVertical="top"
            />
          </View>
        </KeyboardAvoidingView>
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
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.selected,
    ...shadows.soft,
  },
  newBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 36,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  noteContentArea: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  noteBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  noteTime: {
    fontSize: 11,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWarm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    minHeight: 320,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  saveNoteBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.selected,
  },
  saveNoteDisabled: {
    opacity: 0.5,
  },
  saveNoteBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.white,
  },
  modalInput: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
