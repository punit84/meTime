export type Mood = 'happy' | 'sad' | 'calm' | 'anxious' | 'energized';

export type UserProfile = {
  name?: string;
  preferredMood?: Mood;
  onboardingComplete: boolean;
};

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
  mood?: Mood;
  body?: string;
  uri?: string;
  createdAt: string;
};

export type FavoriteTrack = {
  id: string;
  title: string;
  moodTag: Mood;
  uriOrLink: string;
};

export type OutfitSelfie = {
  id: string;
  photoUri: string;
  attire: string;
  feedback: string;
  createdAt: string;
};

export const MOODS: {
  id: Mood;
  label: string;
  short: string;
  mark: string;
}[] = [
  { id: 'happy', label: 'Soft happy', short: 'Happy', mark: '☀' },
  { id: 'sad', label: 'Soft sad', short: 'Sad', mark: '☾' },
  { id: 'calm', label: 'Dreamy calm', short: 'Calm', mark: '☁' },
  { id: 'anxious', label: 'A little uneasy', short: 'Uneasy', mark: '◌' },
  { id: 'energized', label: 'Main character', short: 'Glow', mark: '✦' },
];
