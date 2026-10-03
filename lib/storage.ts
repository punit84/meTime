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
  MirrorEntry,
  MirrorMediaType,
  MoodEntry,
  MoodType,
  UserProfile,
  VoiceEntry,
} from './types';
import { DEFAULT_PREFERENCES, MOOD_VALUES, STORAGE_VERSION } from './types';

// ─── Storage Keys ────────────────────────────────────────

const KEYS = {
  storageVersion: '@metime/version',
  profile: '@metime/profile',
  preferences: '@metime/preferences',
  todayMood: '@metime/mood-today',
  moodHistory: '@metime/mood-history',
  mirror: '@metime/mirror-entries',
  voice: '@metime/voice-entries',
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

// ─── Initialize ──────────────────────────────────────────

export type AppInitData = {
  profile: UserProfile;
  todayMood: MoodEntry | null;
  preferences: AppPreferences;
  mirrorEntries: MirrorEntry[];
  voiceEntries: VoiceEntry[];
  needsOnboarding: boolean;
};

/**
 * Load all required data for app initialization in a single call.
 * Avoids multiple sequential waterfall loads.
 */
export async function initializeApp(): Promise<AppInitData> {
  await ensureStorageVersion();

  const [profile, todayMood, preferences, mirrorEntries, voiceEntries] =
    await Promise.all([
      getProfile(),
      getTodayMood(),
      getPreferences(),
      getMirrorEntries(),
      getVoiceEntries(),
    ]);

  return {
    profile,
    todayMood,
    preferences,
    mirrorEntries,
    voiceEntries,
    needsOnboarding: !profile.onboardingComplete,
  };
}

// ─── Dev / Debug Utilities ───────────────────────────────

/** Clear all Me Time data. Only available in development. */
export async function clearAllData(): Promise<void> {
  if (!__DEV__) return;
  // Clean up media files before wiping keys
  try {
    const [mirror, voice] = await Promise.all([
      getMirrorEntries(),
      getVoiceEntries(),
    ]);
    await Promise.all([
      ...mirror.map((e) => safeDeleteFile(e.uri)),
      ...voice.map((e) => safeDeleteFile(e.uri)),
    ]);
  } catch {
    // Ignore cleanup error in dev
  }
  const allKeys = Object.values(KEYS);
  await AsyncStorage.multiRemove(allKeys);
}
