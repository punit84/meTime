import { ImageSourcePropType } from 'react-native';
import { images } from '@/lib/images';
import { MOODS } from '@/lib/moods';
import { MoodType } from '@/lib/types';
import type { MoodConfig } from '@/lib/types-phase1';

export type MoodMatchRound = {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  prompt: string;
  responses: Record<MoodType, string>;
};

export const MOOD_MATCH_ROUNDS: MoodMatchRound[] = [
  {
    id: 'morning-sun',
    title: 'Sunlit Morning',
    description: 'Warm sunlight streaming across fresh flowers, soft linens, and quiet music playing.',
    image: images.home.listen,
    prompt: 'What mood does this feel like?',
    responses: {
      happy: 'A little lightness in the air.',
      glow: 'Radiating soft, warm energy.',
      calm: 'Peaceful and unhurried.',
      uneasy: 'Even bright days can feel full.',
      sad: 'Gentle warmth for a quiet heart.',
    },
  },
  {
    id: 'rainy-window',
    title: 'Rainy Afternoon',
    description: 'Soft rain tapping against the glass, wrapped in a blanket with a warm cup.',
    image: images.myspace.memories,
    prompt: 'What mood does this feel like?',
    responses: {
      calm: 'A quiet, restful moment.',
      sad: 'Soft feelings are always allowed.',
      happy: 'Finding comfort in the gentle pitter-patter.',
      uneasy: 'Watching the gray clouds drift by.',
      glow: 'Cocooned and safe inside.',
    },
  },
  {
    id: 'scattered-desk',
    title: 'Scattered Pages',
    description: 'A crowded desk with open notebooks, notifications buzzing, and a full to-do list.',
    image: images.home.write,
    prompt: 'What mood does this feel like?',
    responses: {
      uneasy: "It's okay to feel a little unsettled.",
      calm: 'Breathing steadily through the clutter.',
      sad: 'A lot of thoughts to carry right now.',
      happy: 'Finding creative spark within the bustle.',
      glow: 'Ready to take it one step at a time.',
    },
  },
  {
    id: 'evening-skincare',
    title: 'Self-Care Ritual',
    description: 'A softly lit mirror, soothing cream on your skin, and a quiet candle.',
    image: images.skincare.hero,
    prompt: 'What mood does this feel like?',
    responses: {
      calm: 'A soothing pause for yourself.',
      glow: 'Taking gentle care of who you are.',
      happy: 'Small rituals that bring simple joy.',
      uneasy: 'Letting your shoulders drop and unwind.',
      sad: 'Tender care for a weary mind.',
    },
  },
  {
    id: 'mirror-confidence',
    title: 'Before Stepping Out',
    description: 'Warm mirror reflection, favorite scent in the air, choosing a piece that feels like you.',
    image: images.mirror.hero,
    prompt: 'What mood does this feel like?',
    responses: {
      glow: 'A little confidence looks good on you.',
      happy: 'Stepping forward with a smile.',
      calm: 'Centered and quietly sure of yourself.',
      uneasy: 'Taking a deep breath before you begin.',
      sad: 'Being kind to yourself as you are.',
    },
  },
];

/** Fisher-Yates shuffle array immutably */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  let i = result.length;
  while (--i > 0) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temp = result[randomIndex];
    result[randomIndex] = result[i];
    result[i] = temp;
  }
  return result;
}

/** Create a fresh 5-round shuffled game session */
export function createMoodMatchSession(): MoodMatchRound[] {
  return shuffleArray(MOOD_MATCH_ROUNDS);
}

/** Calculate summary counts of chosen moods */
export function calculateMoodSummary(answers: MoodType[]): Record<MoodType, number> {
  const summary: Record<MoodType, number> = {
    happy: 0,
    sad: 0,
    calm: 0,
    uneasy: 0,
    glow: 0,
  };

  answers.forEach((mood) => {
    if (summary[mood] !== undefined) {
      summary[mood] += 1;
    }
  });

  return summary;
}

/** Reusable list of mood options with presentation metadata */
export const MOOD_OPTIONS: MoodConfig[] = MOODS;
