/**
 * Me Time — Local Storage Service
 *
 * All persistence goes through this module. The UI never calls
 * AsyncStorage directly. This makes future migrations and
 * backend integration straightforward.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import type {
  AppPreferences,
  JournalDraft,
  JournalEntry,
  JournalPhoto,
  MirrorEntry,
  MirrorMediaType,
  MoodEntry,
  MoodType,
  MusicCategoryId,
  PrivateNote,
  RecentlyPlayedTrack,
  SkinCareCategory,
  SkinCareDayRecord,
  SkinCarePeriod,
  SkinCareReminders,
  SkinCareRoutine,
  SkinCareStep,
  UserProfile,
  VoiceEntry,
} from './types';
import {
  DEFAULT_PREFERENCES,
  DEFAULT_SKIN_CARE_REMINDERS,
  EMPTY_SKIN_CARE_ROUTINE,
  MUSIC_CATEGORY_IDS,
  MOOD_VALUES,
  SKIN_CARE_CATEGORIES,
  STORAGE_VERSION,
} from './types';
import { createDefaultSteps, localDateKey } from './skinCare';

// ─── Storage Keys ────────────────────────────────────────

const KEYS = {
  storageVersion: '@metime/version',
  profile: '@metime/profile',
  preferences: '@metime/preferences',
  todayMood: '@metime/mood-today',
  moodHistory: '@metime/mood-history',
  mirror: '@metime/mirror-entries',
  voice: '@metime/voice-entries',
  skinCareRoutine: '@metime/skin-care-routine',
  skinCareToday: '@metime/skin-care-today',
  skinCareHistory: '@metime/skin-care-history',
  musicRecentSearches: '@metime/music-recent-searches',
  musicRecentlyPlayed: '@metime/music-recently-played',
  journalEntries: '@metime/journal-entries',
  journalPhotos: '@metime/journal-photos',
  privateNotes: '@metime/private-notes',
  journalDraft: '@metime/journal-draft',
  // Legacy keys kept for possible future migration
  strengths: '@metime/strengths',
  growth: '@metime/growth',
  journal: '@metime/journal',
  tracks: '@metime/tracks',
  selfies: '@metime/selfies',
} as const;

// ─── Helpers ─────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Today's date as YYYY-MM-DD in local time. */
function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (__DEV__) {
      console.warn(`[MeTime Storage] Failed to write key "${key}":`, error);
    }
  }
}

// ─── Storage Version ─────────────────────────────────────

export async function checkStorageVersion(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.storageVersion);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export async function setStorageVersion(version: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.storageVersion, String(version));
}

export async function ensureStorageVersion(): Promise<void> {
  const current = await checkStorageVersion();
  if (current < STORAGE_VERSION) {
    // Future: run migrations here based on `current` value.
    await setStorageVersion(STORAGE_VERSION);
  }
}

// ─── User Profile ────────────────────────────────────────

const EMPTY_PROFILE: UserProfile = {
  id: '',
  name: '',
  createdAt: '',
  updatedAt: '',
  onboardingComplete: false,
};

function isValidProfile(data: unknown): data is UserProfile {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.onboardingComplete === 'boolean' &&
    typeof obj.name === 'string'
  );
}

export async function getProfile(): Promise<UserProfile> {
  const raw = await readJson<unknown>(KEYS.profile, null);
  if (!raw) return { ...EMPTY_PROFILE };

  // Handle legacy profiles that had simpler shape
  if (isValidProfile(raw)) {
    return {
      id: (raw.id as string) || '',
      name: raw.name || '',
      createdAt: (raw.createdAt as string) || '',
      updatedAt: (raw.updatedAt as string) || '',
      onboardingComplete: raw.onboardingComplete,
    };
  }

  // Legacy shape: { onboardingComplete, name?, preferredMood? }
  const legacy = raw as Record<string, unknown>;
  if (typeof legacy.onboardingComplete === 'boolean') {
    return {
      id: '',
      name: typeof legacy.name === 'string' ? legacy.name : '',
      createdAt: '',
      updatedAt: '',
      onboardingComplete: legacy.onboardingComplete,
    };
  }

  return { ...EMPTY_PROFILE };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await writeJson(KEYS.profile, profile);
}

export async function updateProfileName(name: string): Promise<UserProfile> {
  const current = await getProfile();
  const updated: UserProfile = {
    ...current,
    name: name.trim(),
    updatedAt: new Date().toISOString(),
  };
  await saveProfile(updated);
  return updated;
}

export async function completeOnboarding(name: string): Promise<UserProfile> {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    id: generateId(),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    onboardingComplete: true,
  };
  await saveProfile(profile);
  return profile;
}

// ─── Today's Mood ────────────────────────────────────────

type TodayMoodData = {
  date: string;
  entry: MoodEntry;
};

function isValidMood(value: unknown): value is MoodType {
  return typeof value === 'string' && MOOD_VALUES.includes(value as MoodType);
}

export async function getTodayMood(): Promise<MoodEntry | null> {
  const data = await readJson<TodayMoodData | null>(KEYS.todayMood, null);
  if (!data) return null;

  // Only return if the stored date matches today
  if (data.date !== todayKey()) return null;
  if (!data.entry || !isValidMood(data.entry.mood)) return null;

  return data.entry;
}

export async function saveTodayMood(mood: MoodType): Promise<MoodEntry> {
  const now = new Date().toISOString();
  const today = todayKey();

  const existing = await readJson<TodayMoodData | null>(KEYS.todayMood, null);

  let entry: MoodEntry;

  if (existing && existing.date === today && existing.entry) {
    // Update today's existing entry rather than creating a new one
    entry = { ...existing.entry, mood, createdAt: now };
  } else {
    // Create a new entry for today
    entry = { id: generateId(), mood, createdAt: now };
  }

  await writeJson<TodayMoodData>(KEYS.todayMood, { date: today, entry });

  // Also add/update in mood history
  await addToMoodHistory(entry);

  return entry;
}

// ─── Mood History ────────────────────────────────────────

async function addToMoodHistory(entry: MoodEntry): Promise<void> {
  const history = await getMoodHistory();

  // Check if there's already an entry with the same ID (update case)
  const existingIndex = history.findIndex((e) => e.id === entry.id);

  let updated: MoodEntry[];
  if (existingIndex >= 0) {
    updated = [...history];
    updated[existingIndex] = entry;
  } else {
    updated = [entry, ...history];
  }

  // Keep a reasonable amount of history (last 90 entries)
  const trimmed = updated.slice(0, 90);
  await writeJson(KEYS.moodHistory, trimmed);
}

export async function getMoodHistory(): Promise<MoodEntry[]> {
  const raw = await readJson<unknown[]>(KEYS.moodHistory, []);
  // Validate each entry
  return raw.filter(
    (item): item is MoodEntry =>
      item !== null &&
      typeof item === 'object' &&
      typeof (item as MoodEntry).id === 'string' &&
      isValidMood((item as MoodEntry).mood) &&
      typeof (item as MoodEntry).createdAt === 'string'
  );
}

// ─── Preferences ─────────────────────────────────────────

export async function getPreferences(): Promise<AppPreferences> {
  const raw = await readJson<unknown>(KEYS.preferences, null);
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFERENCES };

  const obj = raw as Record<string, unknown>;
  return {
    appearance:
      obj.appearance === 'system' || obj.appearance === 'light' || obj.appearance === 'dark'
        ? obj.appearance
        : DEFAULT_PREFERENCES.appearance,
    notificationsEnabled:
      typeof obj.notificationsEnabled === 'boolean'
        ? obj.notificationsEnabled
        : DEFAULT_PREFERENCES.notificationsEnabled,
  };
}

export async function savePreferences(prefs: AppPreferences): Promise<void> {
  await writeJson(KEYS.preferences, prefs);
}

// ─── Mirror Media ────────────────────────────────────────

async function safeDeleteFile(uri: string): Promise<void> {
  if (!uri || typeof uri !== 'string' || uri.startsWith('http') || uri.startsWith('data:')) {
    return;
  }
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Gracefully handle file system issues without crashing
  }
}

function isValidMirrorType(value: unknown): value is MirrorMediaType {
  return value === 'photo' || value === 'video';
}

function isValidMirrorEntry(item: unknown): item is MirrorEntry {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    isValidMirrorType(obj.type) &&
    typeof obj.uri === 'string' &&
    typeof obj.createdAt === 'string' &&
    (obj.mood === undefined || obj.mood === null || isValidMood(obj.mood))
  );
}

export async function getMirrorEntries(): Promise<MirrorEntry[]> {
  const raw = await readJson<unknown[]>(KEYS.mirror, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidMirrorEntry);
}

export async function saveMirrorEntry(data: {
  type: MirrorMediaType;
  uri: string;
  mood?: MoodType | null;
}): Promise<MirrorEntry> {
  const now = new Date().toISOString();
  const entry: MirrorEntry = {
    id: `mirror_${generateId()}`,
    type: data.type,
    uri: data.uri,
    createdAt: now,
    mood: data.mood || null,
  };

  const existing = await getMirrorEntries();
  const updated = [entry, ...existing];
  await writeJson(KEYS.mirror, updated);
  return entry;
}

export async function deleteMirrorEntry(id: string): Promise<void> {
  const existing = await getMirrorEntries();
  const entryToDelete = existing.find((e) => e.id === id);

  if (entryToDelete) {
    // Attempt to remove the local file
    await safeDeleteFile(entryToDelete.uri);
  }

  const updated = existing.filter((e) => e.id !== id);
  await writeJson(KEYS.mirror, updated);
}

export async function clearMirrorEntries(): Promise<void> {
  const existing = await getMirrorEntries();
  await Promise.all(existing.map((e) => safeDeleteFile(e.uri)));
  await AsyncStorage.removeItem(KEYS.mirror);
}

// ─── Voice Entries (Soft Talk) ───────────────────────────

function isValidVoiceEntry(item: unknown): item is VoiceEntry {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.uri === 'string' &&
    typeof obj.durationMs === 'number' &&
    typeof obj.createdAt === 'string' &&
    (obj.mood === undefined || obj.mood === null || isValidMood(obj.mood)) &&
    (obj.title === undefined || obj.title === null || typeof obj.title === 'string')
  );
}

export async function getVoiceEntries(): Promise<VoiceEntry[]> {
  const raw = await readJson<unknown[]>(KEYS.voice, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidVoiceEntry);
}

export async function saveVoiceEntry(data: {
  uri: string;
  durationMs: number;
  mood?: MoodType | null;
  title?: string | null;
}): Promise<VoiceEntry> {
  const now = new Date().toISOString();
  const entry: VoiceEntry = {
    id: `voice_${generateId()}`,
    uri: data.uri,
    durationMs: data.durationMs,
    createdAt: now,
    mood: data.mood || null,
    title: data.title || null,
  };

  const existing = await getVoiceEntries();
  const updated = [entry, ...existing];
  await writeJson(KEYS.voice, updated);
  return entry;
}

export async function deleteVoiceEntry(id: string): Promise<void> {
  const existing = await getVoiceEntries();
  const entryToDelete = existing.find((e) => e.id === id);

  if (entryToDelete) {
    await safeDeleteFile(entryToDelete.uri);
  }

  const updated = existing.filter((e) => e.id !== id);
  await writeJson(KEYS.voice, updated);
}

export async function clearVoiceEntries(): Promise<void> {
  const existing = await getVoiceEntries();
  await Promise.all(existing.map((e) => safeDeleteFile(e.uri)));
  await AsyncStorage.removeItem(KEYS.voice);
}

// ─── Skin Care ───────────────────────────────────────────

const HISTORY_LIMIT = 60;

function isValidPeriod(value: unknown): value is SkinCarePeriod {
  return value === 'morning' || value === 'evening';
}

function isValidCategory(value: unknown): value is SkinCareCategory {
  return (
    typeof value === 'string' &&
    (SKIN_CARE_CATEGORIES as readonly string[]).includes(value)
  );
}

function isValidTimeString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function isValidSkinCareStep(item: unknown): item is SkinCareStep {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    isValidPeriod(obj.period) &&
    typeof obj.name === 'string' &&
    obj.name.trim().length > 0 &&
    isValidCategory(obj.category) &&
    typeof obj.sortOrder === 'number' &&
    (obj.productName === undefined ||
      obj.productName === null ||
      typeof obj.productName === 'string') &&
    (obj.notes === undefined ||
      obj.notes === null ||
      typeof obj.notes === 'string')
  );
}

function normalizeReminders(raw: unknown): SkinCareReminders {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SKIN_CARE_REMINDERS };
  }
  const obj = raw as Record<string, unknown>;
  return {
    morningEnabled:
      typeof obj.morningEnabled === 'boolean'
        ? obj.morningEnabled
        : DEFAULT_SKIN_CARE_REMINDERS.morningEnabled,
    eveningEnabled:
      typeof obj.eveningEnabled === 'boolean'
        ? obj.eveningEnabled
        : DEFAULT_SKIN_CARE_REMINDERS.eveningEnabled,
    morningTime: isValidTimeString(obj.morningTime)
      ? obj.morningTime
      : DEFAULT_SKIN_CARE_REMINDERS.morningTime,
    eveningTime: isValidTimeString(obj.eveningTime)
      ? obj.eveningTime
      : DEFAULT_SKIN_CARE_REMINDERS.eveningTime,
  };
}

function isValidDayRecord(item: unknown): item is SkinCareDayRecord {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(obj.date) &&
    Array.isArray(obj.completedStepIds) &&
    obj.completedStepIds.every((id) => typeof id === 'string')
  );
}

export async function getSkinCareRoutine(): Promise<SkinCareRoutine> {
  const raw = await readJson<unknown>(KEYS.skinCareRoutine, null);
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_SKIN_CARE_ROUTINE, reminders: { ...DEFAULT_SKIN_CARE_REMINDERS } };
  }

  const obj = raw as Record<string, unknown>;
  const steps = Array.isArray(obj.steps)
    ? obj.steps.filter(isValidSkinCareStep)
    : [];

  return {
    configured: typeof obj.configured === 'boolean' ? obj.configured : steps.length > 0,
    steps,
    reminders: normalizeReminders(obj.reminders),
  };
}

async function saveSkinCareRoutine(routine: SkinCareRoutine): Promise<void> {
  await writeJson(KEYS.skinCareRoutine, routine);
}

export async function getSkinCareHistory(): Promise<SkinCareDayRecord[]> {
  const raw = await readJson<unknown[]>(KEYS.skinCareHistory, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidDayRecord).slice(0, HISTORY_LIMIT);
}

async function saveSkinCareHistory(history: SkinCareDayRecord[]): Promise<void> {
  await writeJson(KEYS.skinCareHistory, history.slice(0, HISTORY_LIMIT));
}

async function upsertHistoryRecord(record: SkinCareDayRecord): Promise<SkinCareDayRecord[]> {
  const history = await getSkinCareHistory();
  const without = history.filter((h) => h.date !== record.date);
  const updated = [record, ...without].sort((a, b) => b.date.localeCompare(a.date));
  await saveSkinCareHistory(updated);
  return updated;
}

/**
 * Returns today's completion. If the calendar day has rolled over,
 * starts a fresh empty record without touching the routine.
 */
export async function getSkinCareToday(): Promise<SkinCareDayRecord> {
  const today = localDateKey();
  const raw = await readJson<unknown>(KEYS.skinCareToday, null);

  if (isValidDayRecord(raw) && raw.date === today) {
    return {
      date: raw.date,
      completedStepIds: [...new Set(raw.completedStepIds)],
    };
  }

  // Preserve previous day's record in history before rolling
  if (isValidDayRecord(raw) && raw.date !== today) {
    await upsertHistoryRecord({
      date: raw.date,
      completedStepIds: [...new Set(raw.completedStepIds)],
    });
  }

  const fresh: SkinCareDayRecord = { date: today, completedStepIds: [] };
  await writeJson(KEYS.skinCareToday, fresh);
  return fresh;
}

export async function createSkinCareRoutine(): Promise<{
  routine: SkinCareRoutine;
  today: SkinCareDayRecord;
}> {
  const existing = await getSkinCareRoutine();
  if (existing.configured && existing.steps.length > 0) {
    const today = await getSkinCareToday();
    return { routine: existing, today };
  }

  const routine: SkinCareRoutine = {
    configured: true,
    steps: createDefaultSteps(),
    reminders: existing.reminders ?? { ...DEFAULT_SKIN_CARE_REMINDERS },
  };
  await saveSkinCareRoutine(routine);
  const today = await getSkinCareToday();
  return { routine, today };
}

export async function addSkinCareStep(data: {
  period: SkinCarePeriod;
  name: string;
  productName?: string | null;
  notes?: string | null;
  category: SkinCareCategory;
}): Promise<{ routine: SkinCareRoutine; step: SkinCareStep }> {
  const routine = await getSkinCareRoutine();
  const periodSteps = routine.steps.filter((s) => s.period === data.period);
  const nextOrder =
    periodSteps.length > 0
      ? Math.max(...periodSteps.map((s) => s.sortOrder)) + 1
      : 0;

  const step: SkinCareStep = {
    id: `skin_${generateId()}`,
    period: data.period,
    name: data.name.trim(),
    productName: data.productName?.trim() || null,
    notes: data.notes?.trim() || null,
    category: data.category,
    sortOrder: nextOrder,
  };

  const updated: SkinCareRoutine = {
    ...routine,
    configured: true,
    steps: [...routine.steps, step],
  };
  await saveSkinCareRoutine(updated);
  return { routine: updated, step };
}

export async function updateSkinCareStep(
  id: string,
  patch: Partial<{
    period: SkinCarePeriod;
    name: string;
    productName: string | null;
    notes: string | null;
    category: SkinCareCategory;
  }>,
): Promise<SkinCareRoutine> {
  const routine = await getSkinCareRoutine();
  const updated: SkinCareRoutine = {
    ...routine,
    steps: routine.steps.map((step) => {
      if (step.id !== id) return step;
      return {
        ...step,
        period: patch.period ?? step.period,
        name:
          typeof patch.name === 'string' && patch.name.trim()
            ? patch.name.trim()
            : step.name,
        productName:
          patch.productName !== undefined
            ? patch.productName?.trim() || null
            : step.productName,
        notes:
          patch.notes !== undefined
            ? patch.notes?.trim() || null
            : step.notes,
        category: patch.category ?? step.category,
      };
    }),
  };
  await saveSkinCareRoutine(updated);
  return updated;
}

export async function deleteSkinCareStep(id: string): Promise<{
  routine: SkinCareRoutine;
  today: SkinCareDayRecord;
  history: SkinCareDayRecord[];
}> {
  const routine = await getSkinCareRoutine();
  const remaining = routine.steps.filter((s) => s.id !== id);

  // Normalize sortOrder per period
  const morning = remaining
    .filter((s) => s.period === 'morning')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s, i) => ({ ...s, sortOrder: i }));
  const evening = remaining
    .filter((s) => s.period === 'evening')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s, i) => ({ ...s, sortOrder: i }));

  const updated: SkinCareRoutine = {
    ...routine,
    configured: true,
    steps: [...morning, ...evening],
  };
  await saveSkinCareRoutine(updated);

  // Strip deleted id from today + history
  const today = await getSkinCareToday();
  const cleanedToday: SkinCareDayRecord = {
    ...today,
    completedStepIds: today.completedStepIds.filter((sid) => sid !== id),
  };
  await writeJson(KEYS.skinCareToday, cleanedToday);

  const history = await getSkinCareHistory();
  const cleanedHistory = history.map((h) => ({
    ...h,
    completedStepIds: h.completedStepIds.filter((sid) => sid !== id),
  }));
  await saveSkinCareHistory(cleanedHistory);

  return { routine: updated, today: cleanedToday, history: cleanedHistory };
}

export async function reorderSkinCareSteps(
  period: SkinCarePeriod,
  orderedIds: string[],
): Promise<SkinCareRoutine> {
  const routine = await getSkinCareRoutine();
  const other = routine.steps.filter((s) => s.period !== period);
  const periodMap = new Map(
    routine.steps.filter((s) => s.period === period).map((s) => [s.id, s]),
  );

  const reordered: SkinCareStep[] = [];
  orderedIds.forEach((id, index) => {
    const step = periodMap.get(id);
    if (step) {
      reordered.push({ ...step, sortOrder: index });
      periodMap.delete(id);
    }
  });
  // Append any missing steps that weren't in orderedIds
  periodMap.forEach((step) => {
    reordered.push({ ...step, sortOrder: reordered.length });
  });

  const updated: SkinCareRoutine = {
    ...routine,
    steps: [...other, ...reordered],
  };
  await saveSkinCareRoutine(updated);
  return updated;
}

export async function toggleSkinCareStep(stepId: string): Promise<{
  today: SkinCareDayRecord;
  history: SkinCareDayRecord[];
}> {
  const routine = await getSkinCareRoutine();
  if (!routine.steps.some((s) => s.id === stepId)) {
    const today = await getSkinCareToday();
    const history = await getSkinCareHistory();
    return { today, history };
  }

  const today = await getSkinCareToday();
  const has = today.completedStepIds.includes(stepId);
  const completedStepIds = has
    ? today.completedStepIds.filter((id) => id !== stepId)
    : [...today.completedStepIds, stepId];

  const updatedToday: SkinCareDayRecord = {
    date: today.date,
    completedStepIds,
  };
  await writeJson(KEYS.skinCareToday, updatedToday);
  const history = await upsertHistoryRecord(updatedToday);
  return { today: updatedToday, history };
}

export async function resetTodaySkinCare(): Promise<{
  today: SkinCareDayRecord;
  history: SkinCareDayRecord[];
}> {
  const today = localDateKey();
  const fresh: SkinCareDayRecord = { date: today, completedStepIds: [] };
  await writeJson(KEYS.skinCareToday, fresh);
  const history = await upsertHistoryRecord(fresh);
  return { today: fresh, history };
}

export async function updateSkinCareReminders(
  reminders: SkinCareReminders,
): Promise<SkinCareRoutine> {
  const routine = await getSkinCareRoutine();
  const updated: SkinCareRoutine = {
    ...routine,
    reminders: normalizeReminders(reminders),
  };
  await saveSkinCareRoutine(updated);
  return updated;
}

// ─── Music (lightweight metadata only) ───────────────────

const RECENT_SEARCH_LIMIT = 8;
const RECENTLY_PLAYED_LIMIT = 12;

function isValidMusicCategoryId(value: unknown): value is MusicCategoryId {
  return (
    typeof value === 'string' &&
    (MUSIC_CATEGORY_IDS as readonly string[]).includes(value)
  );
}

function isValidRecentlyPlayed(item: unknown): item is RecentlyPlayedTrack {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.artist === 'string' &&
    typeof obj.playedAt === 'string' &&
    (obj.albumImage === undefined || typeof obj.albumImage === 'string') &&
    (obj.spotifyUrl === undefined || typeof obj.spotifyUrl === 'string') &&
    (obj.categoryId === undefined ||
      obj.categoryId === null ||
      isValidMusicCategoryId(obj.categoryId))
  );
}

export async function getMusicRecentSearches(): Promise<string[]> {
  const raw = await readJson<unknown[]>(KEYS.musicRecentSearches, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, RECENT_SEARCH_LIMIT);
}

export async function addMusicRecentSearch(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return getMusicRecentSearches();
  const existing = await getMusicRecentSearches();
  const updated = [
    trimmed,
    ...existing.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, RECENT_SEARCH_LIMIT);
  await writeJson(KEYS.musicRecentSearches, updated);
  return updated;
}

export async function getRecentlyPlayedTracks(): Promise<RecentlyPlayedTrack[]> {
  const raw = await readJson<unknown[]>(KEYS.musicRecentlyPlayed, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidRecentlyPlayed).slice(0, RECENTLY_PLAYED_LIMIT);
}

export async function addRecentlyPlayedTrack(data: {
  id: string;
  title: string;
  artist: string;
  albumImage?: string;
  spotifyUrl?: string;
  categoryId?: MusicCategoryId | null;
}): Promise<RecentlyPlayedTrack[]> {
  const entry: RecentlyPlayedTrack = {
    id: data.id,
    title: data.title,
    artist: data.artist,
    albumImage: data.albumImage,
    spotifyUrl: data.spotifyUrl,
    categoryId: data.categoryId ?? null,
    playedAt: new Date().toISOString(),
  };
  const existing = await getRecentlyPlayedTracks();
  const updated = [
    entry,
    ...existing.filter((t) => t.id !== entry.id),
  ].slice(0, RECENTLY_PLAYED_LIMIT);
  await writeJson(KEYS.musicRecentlyPlayed, updated);
  return updated;
}

// ─── Journal (Write) ─────────────────────────────────────

function isValidJournalPhoto(item: unknown): item is JournalPhoto {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.uri === 'string' &&
    typeof obj.createdAt === 'string' &&
    (obj.caption === undefined || obj.caption === null || typeof obj.caption === 'string') &&
    (obj.entryId === undefined || obj.entryId === null || typeof obj.entryId === 'string')
  );
}

export async function getJournalPhotos(): Promise<JournalPhoto[]> {
  const raw = await readJson<unknown[]>(KEYS.journalPhotos, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidJournalPhoto);
}

export async function saveJournalPhoto(data: {
  uri: string;
  caption?: string | null;
  entryId?: string | null;
}): Promise<JournalPhoto> {
  const now = new Date().toISOString();
  const photo: JournalPhoto = {
    id: `jphoto_${generateId()}`,
    uri: data.uri,
    createdAt: now,
    caption: data.caption?.trim() || null,
    entryId: data.entryId || null,
  };

  const existing = await getJournalPhotos();
  const updated = [photo, ...existing];
  await writeJson(KEYS.journalPhotos, updated);
  return photo;
}

export async function deleteJournalPhoto(id: string): Promise<void> {
  const existing = await getJournalPhotos();
  const photoToDelete = existing.find((p) => p.id === id);

  if (photoToDelete) {
    await safeDeleteFile(photoToDelete.uri);
  }

  const updated = existing.filter((p) => p.id !== id);
  await writeJson(KEYS.journalPhotos, updated);
}

function isValidJournalEntry(item: unknown): item is JournalEntry {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string' &&
    (obj.title === undefined || obj.title === null || typeof obj.title === 'string') &&
    (obj.mood === undefined || obj.mood === null || isValidMood(obj.mood)) &&
    (obj.photoIds === undefined || (Array.isArray(obj.photoIds) && obj.photoIds.every((id) => typeof id === 'string')))
  );
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const [rawEntries, allPhotos] = await Promise.all([
    readJson<unknown[]>(KEYS.journalEntries, []),
    getJournalPhotos(),
  ]);

  if (!Array.isArray(rawEntries)) return [];
  const entries = rawEntries.filter(isValidJournalEntry);

  const photoMap = new Map(allPhotos.map((p) => [p.id, p]));

  // Attach resolved photos
  return entries.map((entry) => {
    const attachedPhotos: JournalPhoto[] = [];
    if (entry.photoIds && entry.photoIds.length > 0) {
      entry.photoIds.forEach((pid) => {
        const photo = photoMap.get(pid);
        if (photo) attachedPhotos.push(photo);
      });
    } else {
      // Check if any photo references this entry by entryId
      allPhotos.forEach((p) => {
        if (p.entryId === entry.id) attachedPhotos.push(p);
      });
    }

    return {
      ...entry,
      photos: attachedPhotos,
    };
  });
}

export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  const entries = await getJournalEntries();
  return entries.find((e) => e.id === id) ?? null;
}

export async function saveJournalEntry(data: {
  title?: string | null;
  content: string;
  mood?: MoodType | null;
  photoIds?: string[];
}): Promise<JournalEntry> {
  const now = new Date().toISOString();
  const entryId = `entry_${generateId()}`;

  const entry: JournalEntry = {
    id: entryId,
    title: data.title?.trim() || null,
    content: data.content.trim(),
    createdAt: now,
    updatedAt: now,
    mood: data.mood || null,
    photoIds: data.photoIds || [],
  };

  // If photoIds are provided, link their entryId
  if (data.photoIds && data.photoIds.length > 0) {
    const photos = await getJournalPhotos();
    const updatedPhotos = photos.map((p) => {
      if (data.photoIds?.includes(p.id)) {
        return { ...p, entryId };
      }
      return p;
    });
    await writeJson(KEYS.journalPhotos, updatedPhotos);
  }

  const existing = await readJson<unknown[]>(KEYS.journalEntries, []);
  const updated = [entry, ...(Array.isArray(existing) ? existing.filter(isValidJournalEntry) : [])];
  await writeJson(KEYS.journalEntries, updated);

  const resolved = await getJournalEntry(entryId);
  return resolved || entry;
}

export async function updateJournalEntry(
  id: string,
  updates: Partial<{
    title: string | null;
    content: string;
    mood: MoodType | null;
    photoIds: string[];
  }>,
): Promise<JournalEntry | null> {
  const rawEntries = await readJson<unknown[]>(KEYS.journalEntries, []);
  if (!Array.isArray(rawEntries)) return null;

  const validEntries = rawEntries.filter(isValidJournalEntry);
  const target = validEntries.find((e) => e.id === id);
  if (!target) return null;

  const now = new Date().toISOString();
  const updatedEntry: JournalEntry = {
    ...target,
    title: updates.title !== undefined ? updates.title?.trim() || null : target.title,
    content: updates.content !== undefined ? updates.content.trim() : target.content,
    mood: updates.mood !== undefined ? updates.mood : target.mood,
    photoIds: updates.photoIds !== undefined ? updates.photoIds : target.photoIds,
    updatedAt: now,
  };

  // If photoIds were updated, update photo links
  if (updates.photoIds !== undefined) {
    const photos = await getJournalPhotos();
    const updatedPhotos = photos.map((p) => {
      if (updates.photoIds?.includes(p.id)) {
        return { ...p, entryId: id };
      }
      if (p.entryId === id && !updates.photoIds?.includes(p.id)) {
        return { ...p, entryId: null };
      }
      return p;
    });
    await writeJson(KEYS.journalPhotos, updatedPhotos);
  }

  const updatedList = validEntries.map((e) => (e.id === id ? updatedEntry : e));
  await writeJson(KEYS.journalEntries, updatedList);

  return getJournalEntry(id);
}

export async function deleteJournalEntry(id: string): Promise<boolean> {
  const rawEntries = await readJson<unknown[]>(KEYS.journalEntries, []);
  if (!Array.isArray(rawEntries)) return false;

  const validEntries = rawEntries.filter(isValidJournalEntry);
  const entryToDelete = validEntries.find((e) => e.id === id);
  if (!entryToDelete) return false;

  // Clean up attached photos
  const photos = await getJournalPhotos();
  const attachedPhotos = photos.filter(
    (p) => (entryToDelete.photoIds && entryToDelete.photoIds.includes(p.id)) || p.entryId === id,
  );

  // Safely delete photo files from disk
  await Promise.all(attachedPhotos.map((p) => safeDeleteFile(p.uri)));

  // Remove photo records
  const remainingPhotos = photos.filter(
    (p) => !(entryToDelete.photoIds && entryToDelete.photoIds.includes(p.id)) && p.entryId !== id,
  );
  await writeJson(KEYS.journalPhotos, remainingPhotos);

  // Remove entry
  const remainingEntries = validEntries.filter((e) => e.id !== id);
  await writeJson(KEYS.journalEntries, remainingEntries);

  return true;
}

// ─── Private Notes ───────────────────────────────────────

function isValidPrivateNote(item: unknown): item is PrivateNote {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}

export async function getPrivateNotes(): Promise<PrivateNote[]> {
  const raw = await readJson<unknown[]>(KEYS.privateNotes, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidPrivateNote);
}

export async function savePrivateNote(content: string): Promise<PrivateNote> {
  const now = new Date().toISOString();
  const note: PrivateNote = {
    id: `note_${generateId()}`,
    content: content.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const existing = await getPrivateNotes();
  const updated = [note, ...existing];
  await writeJson(KEYS.privateNotes, updated);
  return note;
}

export async function updatePrivateNote(
  id: string,
  content: string,
): Promise<PrivateNote | null> {
  const existing = await getPrivateNotes();
  const target = existing.find((n) => n.id === id);
  if (!target) return null;

  const updatedNote: PrivateNote = {
    ...target,
    content: content.trim(),
    updatedAt: new Date().toISOString(),
  };

  const updatedList = existing.map((n) => (n.id === id ? updatedNote : n));
  await writeJson(KEYS.privateNotes, updatedList);
  return updatedNote;
}

export async function deletePrivateNote(id: string): Promise<boolean> {
  const existing = await getPrivateNotes();
  const updatedList = existing.filter((n) => n.id !== id);
  await writeJson(KEYS.privateNotes, updatedList);
  return true;
}

// ─── Journal Draft ───────────────────────────────────────

export async function saveJournalDraft(draft: {
  title: string;
  content: string;
  mood?: MoodType | null;
  photoUris?: string[];
}): Promise<void> {
  const data: JournalDraft = {
    title: draft.title,
    content: draft.content,
    mood: draft.mood || null,
    photoUris: draft.photoUris || [],
    updatedAt: new Date().toISOString(),
  };
  await writeJson(KEYS.journalDraft, data);
}

export async function getJournalDraft(): Promise<JournalDraft | null> {
  const raw = await readJson<JournalDraft | null>(KEYS.journalDraft, null);
  if (!raw || typeof raw !== 'object') return null;
  return raw;
}

export async function clearJournalDraft(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.journalDraft);
}

// ─── Initialize ──────────────────────────────────────────

export type AppInitData = {
  profile: UserProfile;
  todayMood: MoodEntry | null;
  preferences: AppPreferences;
  mirrorEntries: MirrorEntry[];
  voiceEntries: VoiceEntry[];
  skinCareRoutine: SkinCareRoutine;
  skinCareToday: SkinCareDayRecord;
  skinCareHistory: SkinCareDayRecord[];
  recentlyPlayed: RecentlyPlayedTrack[];
  musicRecentSearches: string[];
  journalEntries: JournalEntry[];
  journalPhotos: JournalPhoto[];
  privateNotes: PrivateNote[];
  needsOnboarding: boolean;
};

/**
 * Load all required data for app initialization in a single call.
 * Avoids multiple sequential waterfall loads.
 */
export async function initializeApp(): Promise<AppInitData> {
  await ensureStorageVersion();

  const [
    profile,
    todayMood,
    preferences,
    mirrorEntries,
    voiceEntries,
    skinCareRoutine,
    skinCareToday,
    skinCareHistory,
    recentlyPlayed,
    musicRecentSearches,
    journalEntries,
    journalPhotos,
    privateNotes,
  ] = await Promise.all([
    getProfile(),
    getTodayMood(),
    getPreferences(),
    getMirrorEntries(),
    getVoiceEntries(),
    getSkinCareRoutine(),
    getSkinCareToday(),
    getSkinCareHistory(),
    getRecentlyPlayedTracks(),
    getMusicRecentSearches(),
    getJournalEntries(),
    getJournalPhotos(),
    getPrivateNotes(),
  ]);

  return {
    profile,
    todayMood,
    preferences,
    mirrorEntries,
    voiceEntries,
    skinCareRoutine,
    skinCareToday,
    skinCareHistory,
    recentlyPlayed,
    musicRecentSearches,
    journalEntries,
    journalPhotos,
    privateNotes,
    needsOnboarding: !profile.onboardingComplete,
  };
}

// ─── Dev / Debug Utilities ───────────────────────────────

/** Clear all Me Time data. Only available in development. */
export async function clearAllData(): Promise<void> {
  if (!__DEV__) return;
  // Clean up media files before wiping keys
  try {
    const [mirror, voice, journalPhotos] = await Promise.all([
      getMirrorEntries(),
      getVoiceEntries(),
      getJournalPhotos(),
    ]);
    await Promise.all([
      ...mirror.map((e) => safeDeleteFile(e.uri)),
      ...voice.map((e) => safeDeleteFile(e.uri)),
      ...journalPhotos.map((p) => safeDeleteFile(p.uri)),
    ]);
  } catch {
    // Ignore cleanup error in dev
  }
  const allKeys = Object.values(KEYS);
  await AsyncStorage.multiRemove(allKeys);
}
