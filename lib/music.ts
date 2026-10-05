/**
 * Listen / music discovery configuration.
 * Maps Me Time emotional categories → Spotify search queries.
 * Kept separate from Home MoodType.
 */
import type { MoodType, MusicCategoryId } from './types';
import { MUSIC_CATEGORY_IDS } from './types';

export type MusicCategoryConfig = {
  id: MusicCategoryId;
  title: string;
  /** Short subtitle used on category results screen. */
  subtitle: string;
  /** Existing Listen row subtitle (keep visual copy consistent). */
  rowSubtitle: string;
  /** Spotify search query phrases — one is chosen / rotated. */
  queries: string[];
};

export const MUSIC_CATEGORIES: Record<MusicCategoryId, MusicCategoryConfig> = {
  'feel-good': {
    id: 'feel-good',
    title: 'Feel Good',
    subtitle: 'Something bright for your day.',
    rowSubtitle: 'Light and lifting',
    queries: [
      'feel good happy upbeat',
      'feel good pop sunny',
      'happy vibes upbeat',
    ],
  },
  calm: {
    id: 'calm',
    title: 'Calm',
    subtitle: 'Slow down for a moment.',
    rowSubtitle: 'Soft and steady',
    queries: [
      'calm relaxing peaceful',
      'ambient acoustic relaxing',
      'soft instrumental peaceful',
    ],
  },
  cry: {
    id: 'cry',
    title: 'Cry',
    subtitle: 'Let the feelings come.',
    rowSubtitle: 'A safe place to feel',
    queries: [
      'sad emotional acoustic',
      'emotional piano reflective',
      'heartfelt acoustic ballad',
    ],
  },
  focus: {
    id: 'focus',
    title: 'Focus',
    subtitle: 'Give your mind some room.',
    rowSubtitle: 'Quiet concentration',
    queries: [
      'focus concentration instrumental',
      'lofi study concentration',
      'instrumental focus beats',
    ],
  },
  sleep: {
    id: 'sleep',
    title: 'Sleep',
    subtitle: 'Let the day become quiet.',
    rowSubtitle: 'Wind down gently',
    queries: [
      'sleep ambient relaxing',
      'soft piano sleep',
      'ambient nature relaxing sleep',
    ],
  },
  confidence: {
    id: 'confidence',
    title: 'Confidence',
    subtitle: 'Put yourself first.',
    rowSubtitle: 'Stand a little taller',
    queries: [
      'confidence powerful upbeat',
      'energetic motivational upbeat',
      'powerful pop confidence',
    ],
  },
};

export function isMusicCategoryId(value: unknown): value is MusicCategoryId {
  return (
    typeof value === 'string' &&
    (MUSIC_CATEGORY_IDS as readonly string[]).includes(value)
  );
}

export function getMusicCategory(id: MusicCategoryId): MusicCategoryConfig {
  return MUSIC_CATEGORIES[id];
}

/** Pick a search query for a category; optional seed for variety. */
export function pickCategoryQuery(
  id: MusicCategoryId,
  seed: number = Date.now(),
): string {
  const queries = MUSIC_CATEGORIES[id].queries;
  return queries[seed % queries.length] ?? queries[0] ?? id;
}

/** Map Home mood → suggested Listen category (gentle recommendation only). */
export function listenCategoryForHomeMood(
  mood: MoodType | null | undefined,
): MusicCategoryId | null {
  if (!mood) return null;
  switch (mood) {
    case 'happy':
    case 'glow':
      return 'feel-good';
    case 'calm':
      return 'calm';
    case 'sad':
      return 'cry';
    case 'uneasy':
      return 'focus';
    default:
      return null;
  }
}

export function randomMusicCategory(seed: number = Date.now()): MusicCategoryId {
  return MUSIC_CATEGORY_IDS[seed % MUSIC_CATEGORY_IDS.length] ?? 'calm';
}

export function formatTrackDuration(ms?: number): string {
  if (!ms || ms <= 0) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
