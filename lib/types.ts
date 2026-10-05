/**
 * Me Time — Phase 2 Data Models
 *
 * Central type definitions for user data, mood tracking,
 * and application preferences.
 */

// ─── Mood ────────────────────────────────────────────────

/** The five approved mood values. */
export type MoodType = 'happy' | 'sad' | 'calm' | 'uneasy' | 'glow';

/** All allowed mood IDs — use for runtime validation. */
export const MOOD_VALUES: readonly MoodType[] = [
  'happy',
  'sad',
  'calm',
  'uneasy',
  'glow',
] as const;

/** A single mood check-in entry. */
export type MoodEntry = {
  id: string;
  mood: MoodType;
  createdAt: string; // ISO 8601
};

// ─── Mirror Media ────────────────────────────────────────

export type MirrorMediaType = 'photo' | 'video';

export type MirrorEntry = {
  id: string;
  type: MirrorMediaType;
  uri: string;
  createdAt: string; // ISO 8601
  mood?: MoodType | null;
};

// ─── Voice Notes (Soft Talk) ─────────────────────────────

export type VoiceEntry = {
  id: string;
  uri: string;
  durationMs: number;
  createdAt: string; // ISO 8601
  mood?: MoodType | null;
  title?: string | null;
};

// ─── User Profile ────────────────────────────────────────

export type UserProfile = {
  id: string;
  name: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  onboardingComplete: boolean;
};

// ─── Preferences ─────────────────────────────────────────

export type AppearanceMode = 'system' | 'light' | 'dark';

export type AppPreferences = {
  appearance: AppearanceMode;
  notificationsEnabled: boolean;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  appearance: 'system',
  notificationsEnabled: true,
};

// ─── Skin Care ───────────────────────────────────────────

export type SkinCarePeriod = 'morning' | 'evening';

export type SkinCareCategory =
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'treatment'
  | 'moisturizer'
  | 'sunscreen'
  | 'eye-care'
  | 'other';

export const SKIN_CARE_CATEGORIES: readonly SkinCareCategory[] = [
  'cleanser',
  'toner',
  'serum',
  'treatment',
  'moisturizer',
  'sunscreen',
  'eye-care',
  'other',
] as const;

export type SkinCareStep = {
  id: string;
  period: SkinCarePeriod;
  name: string;
  productName?: string | null;
  notes?: string | null;
  category: SkinCareCategory;
  sortOrder: number;
};

export type SkinCareDayRecord = {
  date: string; // YYYY-MM-DD local
  completedStepIds: string[];
};

export type SkinCareReminders = {
  morningEnabled: boolean;
  eveningEnabled: boolean;
  morningTime: string; // HH:mm
  eveningTime: string; // HH:mm
};

export type SkinCareRoutine = {
  configured: boolean;
  steps: SkinCareStep[];
  reminders: SkinCareReminders;
};

export const DEFAULT_SKIN_CARE_REMINDERS: SkinCareReminders = {
  morningEnabled: false,
  eveningEnabled: false,
  morningTime: '08:00',
  eveningTime: '21:00',
};

export const EMPTY_SKIN_CARE_ROUTINE: SkinCareRoutine = {
  configured: false,
  steps: [],
  reminders: { ...DEFAULT_SKIN_CARE_REMINDERS },
};

// ─── Listen / Music ──────────────────────────────────────

/** Listen mood categories — separate from Home MoodType. */
export type MusicCategoryId =
  | 'feel-good'
  | 'calm'
  | 'cry'
  | 'focus'
  | 'sleep'
  | 'confidence';

export const MUSIC_CATEGORY_IDS: readonly MusicCategoryId[] = [
  'feel-good',
  'calm',
  'cry',
  'focus',
  'sleep',
  'confidence',
] as const;

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  albumName?: string;
  albumImage?: string;
  durationMs?: number;
  spotifyUrl?: string;
  previewUrl?: string | null;
  uri?: string;
};

export type MusicArtist = {
  id: string;
  name: string;
  image?: string;
  spotifyUrl?: string;
};

export type MusicAlbum = {
  id: string;
  name: string;
  artist: string;
  image?: string;
  spotifyUrl?: string;
};

export type MusicPlaylist = {
  id: string;
  name: string;
  image?: string;
  spotifyUrl?: string;
  description?: string;
};

export type MusicSearchResults = {
  tracks: MusicTrack[];
  artists: MusicArtist[];
  albums: MusicAlbum[];
  playlists: MusicPlaylist[];
};

export type RecentlyPlayedTrack = {
  id: string;
  title: string;
  artist: string;
  albumImage?: string;
  spotifyUrl?: string;
  categoryId?: MusicCategoryId | null;
  playedAt: string; // ISO
};

// ─── Storage Meta ────────────────────────────────────────

export const STORAGE_VERSION = 1;

export type StorageState = {
  version: number;
};

// ─── Legacy re-exports for backward compatibility ────────

/**
 * @deprecated Use MoodType instead.
 * Kept temporarily so existing imports don't break during migration.
 */
export type Mood = MoodType;

// ─── Content Models (unchanged from Phase 1) ────────────

export type Strength = {
  id: string;
  text: string;
  createdAt: string;
};

/** Growth tips — never labeled "weakness" in the UI */
export type GrowthAction = {
  id: string;
  tipText: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  type: 'text' | 'voice';
  mood?: MoodType;
  body?: string;
  uri?: string;
  createdAt: string;
};

export type FavoriteTrack = {
  id: string;
  title: string;
  moodTag: MoodType;
  uriOrLink: string;
};

export type OutfitSelfie = {
  id: string;
  photoUri: string;
  attire: string;
  feedback: string;
  createdAt: string;
};
