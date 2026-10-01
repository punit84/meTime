import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  FavoriteTrack,
  GrowthAction,
  JournalEntry,
  Mood,
  OutfitSelfie,
  Strength,
  UserProfile,
} from './types';

const KEYS = {
  profile: '@metime/profile',
  strengths: '@metime/strengths',
  growth: '@metime/growth',
  journal: '@metime/journal',
  tracks: '@metime/tracks',
  mood: '@metime/mood',
  selfies: '@metime/selfies',
} as const;

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getProfile(): Promise<UserProfile> {
  return readJson<UserProfile>(KEYS.profile, { onboardingComplete: false });
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await writeJson(KEYS.profile, profile);
}

export async function getCurrentMood(): Promise<Mood | null> {
  const value = await AsyncStorage.getItem(KEYS.mood);
  return (value as Mood | null) ?? null;
}

export async function setCurrentMood(mood: Mood): Promise<void> {
  await AsyncStorage.setItem(KEYS.mood, mood);
}

export async function getStrengths(): Promise<Strength[]> {
  return readJson<Strength[]>(KEYS.strengths, []);
}

export async function addStrength(text: string): Promise<Strength[]> {
  const list = await getStrengths();
  const next = [
    { id: id(), text: text.trim(), createdAt: new Date().toISOString() },
    ...list,
  ];
  await writeJson(KEYS.strengths, next);
  return next;
}

export async function removeStrength(strengthId: string): Promise<Strength[]> {
  const list = await getStrengths();
  const next = list.filter((s) => s.id !== strengthId);
  await writeJson(KEYS.strengths, next);
  return next;
}

export async function getGrowthActions(): Promise<GrowthAction[]> {
  return readJson<GrowthAction[]>(KEYS.growth, []);
}

export async function addGrowthAction(tipText: string): Promise<GrowthAction[]> {
  const list = await getGrowthActions();
  const next = [
    {
      id: id(),
      tipText: tipText.trim(),
      createdAt: new Date().toISOString(),
    },
    ...list,
  ];
  await writeJson(KEYS.growth, next);
  return next;
}

export async function removeGrowthAction(actionId: string): Promise<GrowthAction[]> {
  const list = await getGrowthActions();
  const next = list.filter((a) => a.id !== actionId);
  await writeJson(KEYS.growth, next);
  return next;
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return readJson<JournalEntry[]>(KEYS.journal, []);
}

export async function addJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'createdAt'>
): Promise<JournalEntry[]> {
  const list = await getJournalEntries();
  const next = [
    {
      ...entry,
      id: id(),
      createdAt: new Date().toISOString(),
    },
    ...list,
  ];
  await writeJson(KEYS.journal, next);
  return next;
}

export async function removeJournalEntry(entryId: string): Promise<JournalEntry[]> {
  const list = await getJournalEntries();
  const next = list.filter((e) => e.id !== entryId);
  await writeJson(KEYS.journal, next);
  return next;
}

export async function getTracks(): Promise<FavoriteTrack[]> {
  return readJson<FavoriteTrack[]>(KEYS.tracks, []);
}

export async function addTrack(
  track: Omit<FavoriteTrack, 'id'>
): Promise<FavoriteTrack[]> {
  const list = await getTracks();
  const next = [{ ...track, id: id() }, ...list];
  await writeJson(KEYS.tracks, next);
  return next;
}

export async function removeTrack(trackId: string): Promise<FavoriteTrack[]> {
  const list = await getTracks();
  const next = list.filter((t) => t.id !== trackId);
  await writeJson(KEYS.tracks, next);
  return next;
}

export async function getSelfies(): Promise<OutfitSelfie[]> {
  return readJson<OutfitSelfie[]>(KEYS.selfies, []);
}

export async function addSelfie(
  selfie: Omit<OutfitSelfie, 'id' | 'createdAt'>
): Promise<OutfitSelfie[]> {
  const list = await getSelfies();
  const next = [
    {
      ...selfie,
      id: id(),
      createdAt: new Date().toISOString(),
    },
    ...list,
  ];
  await writeJson(KEYS.selfies, next);
  return next;
}

export async function removeSelfie(selfieId: string): Promise<OutfitSelfie[]> {
  const list = await getSelfies();
  const next = list.filter((s) => s.id !== selfieId);
  await writeJson(KEYS.selfies, next);
  return next;
}
