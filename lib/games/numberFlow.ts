export interface LevelConfig {
  level: number;
  totalNumbers: number;
  columns: number;
  rows: number;
}

export const NUMBER_FLOW_LEVELS: LevelConfig[] = [
  { level: 1, totalNumbers: 9, columns: 3, rows: 3 },
  { level: 2, totalNumbers: 12, columns: 3, rows: 4 },
  { level: 3, totalNumbers: 16, columns: 4, rows: 4 },
  { level: 4, totalNumbers: 20, columns: 4, rows: 5 },
  { level: 5, totalNumbers: 25, columns: 5, rows: 5 },
];

/**
 * Proper Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a shuffled array of numbers from 1 to totalNumbers
 */
export function createLevelGrid(totalNumbers: number): number[] {
  const numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);
  return shuffleArray(numbers);
}
