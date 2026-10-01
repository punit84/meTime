import { ImageSourcePropType } from 'react-native';
import { images } from '@/lib/images';
import { colors } from '@/lib/theme';

export type SpaceItem = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
};

export type ExploreItem = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  wash: string;
};

export type PlaylistItem = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
};

export type SettingsItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: 'person-outline' | 'lock-closed-outline' | 'notifications-outline' | 'color-palette-outline' | 'language-outline' | 'help-circle-outline' | 'information-circle-outline';
};

export type FeatureAction = {
  id: string;
  title: string;
  subtitle: string;
};

export const SPACE_ITEMS: SpaceItem[] = [
  {
    id: 'journal',
    title: 'My Journal',
    subtitle: 'Private pages for your thoughts',
    image: images.myspace.journal,
  },
  {
    id: 'mirror',
    title: 'My Mirror',
    subtitle: 'Moments you’ve saved with yourself',
    image: images.myspace.mirror,
  },
  {
    id: 'voice',
    title: 'My Voice',
    subtitle: 'Soft recordings, only for you',
    image: images.myspace.voice,
  },
  {
    id: 'memories',
    title: 'My Memories',
    subtitle: 'Gentle keepsakes from your days',
    image: images.myspace.memories,
  },
  {
    id: 'letters',
    title: 'Letters to Myself',
    subtitle: 'Notes from you, to you',
    image: images.myspace.letters,
  },
];

export const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: 'tiny-games',
    title: 'Tiny Games',
    subtitle: 'Soft play for a short pause',
    image: images.explore.tinyGames,
    wash: colors.surfacePeach,
  },
  {
    id: 'glow',
    title: 'Glow',
    subtitle: 'Little rituals that warm you',
    image: images.explore.glow,
    wash: colors.surfaceWarm,
  },
  {
    id: 'just-be',
    title: 'Just Be',
    subtitle: 'Nothing to fix. Just presence.',
    image: images.explore.justBe,
    wash: colors.surfaceLavender,
  },
  {
    id: 'prompts',
    title: 'Daily Prompts',
    subtitle: 'A quiet question for today',
    image: images.explore.prompts,
    wash: colors.surfaceRose,
  },
];

export const PLAYLISTS: PlaylistItem[] = [
  {
    id: 'feel-good',
    title: 'Feel Good',
    subtitle: 'Light and lifting',
    image: images.home.listen,
  },
  {
    id: 'calm',
    title: 'Calm',
    subtitle: 'Soft and steady',
    image: images.listen.hero,
  },
  {
    id: 'cry',
    title: 'Cry',
    subtitle: 'A safe place to feel',
    image: images.myspace.memories,
  },
  {
    id: 'focus',
    title: 'Focus',
    subtitle: 'Quiet concentration',
    image: images.home.write,
  },
  {
    id: 'sleep',
    title: 'Sleep',
    subtitle: 'Wind down gently',
    image: images.explore.justBe,
  },
  {
    id: 'confidence',
    title: 'Confidence',
    subtitle: 'Stand a little taller',
    image: images.home.mirror,
  },
];

export const SETTINGS_ITEMS: SettingsItem[] = [
  { id: 'profile', title: 'Profile', subtitle: 'Your name and preferences', icon: 'person-outline' },
  { id: 'lock', title: 'App Lock', subtitle: 'Keep this space private', icon: 'lock-closed-outline' },
  { id: 'notifications', title: 'Notifications', subtitle: 'Gentle reminders only', icon: 'notifications-outline' },
  { id: 'appearance', title: 'Appearance', subtitle: 'Theme and display', icon: 'color-palette-outline' },
  { id: 'language', title: 'Language', subtitle: 'Choose your language', icon: 'language-outline' },
  { id: 'help', title: 'Help & Support', subtitle: 'We’re here if you need us', icon: 'help-circle-outline' },
  { id: 'about', title: 'About', subtitle: 'Me Time', icon: 'information-circle-outline' },
];

export const FEATURE_ACTIONS: Record<string, FeatureAction[]> = {
  mirror: [
    { id: 'photo', title: 'Take a Photo', subtitle: 'Capture a quiet moment' },
    { id: 'video', title: 'Record Video', subtitle: 'Be with yourself on camera' },
    { id: 'gallery', title: 'My Mirror', subtitle: 'Your saved reflections' },
  ],
  'skin-care': [
    { id: 'routine', title: 'Daily Routine', subtitle: 'Your soft care steps' },
    { id: 'reminders', title: 'Reminders', subtitle: 'Gentle nudges only' },
    { id: 'journal', title: 'Skin Journal', subtitle: 'Note how your skin feels' },
    { id: 'ideas', title: 'Self Care Ideas', subtitle: 'Small rituals to try' },
  ],
  write: [
    { id: 'new', title: 'New Journal Entry', subtitle: 'Begin a private page' },
    { id: 'entries', title: 'My Entries', subtitle: 'Everything you’ve written' },
    { id: 'photo', title: 'Add Photo', subtitle: 'Keep a visual memory' },
    { id: 'notes', title: 'My Private Notes', subtitle: 'Short thoughts, safely held' },
  ],
  games: [
    { id: 'puzzle', title: 'Puzzle', subtitle: 'A slow, soothing puzzle' },
    { id: 'memory', title: 'Memory', subtitle: 'Gentle matching play' },
    { id: 'breathe', title: 'Breathe', subtitle: 'A tiny reset' },
    { id: 'colors', title: 'Colors', subtitle: 'Soft color play' },
  ],
};
