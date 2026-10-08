/**
 * Pure Game Logic for Memory Card Game
 * Ported from the original Memory-card-game implementation.
 *
 * 8 pairs (16 cards total) in a 4x4 grid.
 */

export type MemoryCardItem = {
  id: string; // Unique instance ID
  pairId: string; // Identifier shared by both matching cards
  name: string; // Display label
  icon: string; // Emoji / Symbol representation
  accentColor: string; // Subtle wash color
  isFlipped: boolean;
  isMatched: boolean;
};

export const MEMORY_CARD_TYPES = [
  { pairId: 'blossom', name: 'Cherry Blossom', icon: '🌸', accentColor: '#F3E4E0' },
  { pairId: 'leaf', name: 'Gentle Leaf', icon: '🌿', accentColor: '#E7EDE7' },
  { pairId: 'lemon', name: 'Lemon', icon: '🍋', accentColor: '#FDF6E2' },
  { pairId: 'grapes', name: 'Grapes', icon: '🍇', accentColor: '#EAE6EF' },
  { pairId: 'berry', name: 'Strawberry', icon: '🍓', accentColor: '#FCEBE6' },
  { pairId: 'orange', name: 'Orange', icon: '🍊', accentColor: '#F4E6DA' },
  { pairId: 'watermelon', name: 'Watermelon', icon: '🍉', accentColor: '#EAF0EA' },
  { pairId: 'sunflower', name: 'Sunflower', icon: '🌻', accentColor: '#FFF5EB' },
] as const;

/** Fisher-Yates shuffle array immutably */
export function shuffleCards<T>(arr: T[]): T[] {
  const result = [...arr];
  let currentIndex = result.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    const temp = result[currentIndex];
    result[currentIndex] = result[randomIndex];
    result[randomIndex] = temp;
  }
  return result;
}

/** Create a fresh 16-card shuffled deck with 8 matching pairs */
export function createMemoryDeck(): MemoryCardItem[] {
  const deck: MemoryCardItem[] = [];

  MEMORY_CARD_TYPES.forEach((type, typeIndex) => {
    // Card 1 of pair
    deck.push({
      id: `${type.pairId}_a_${typeIndex}`,
      pairId: type.pairId,
      name: type.name,
      icon: type.icon,
      accentColor: type.accentColor,
      isFlipped: false,
      isMatched: false,
    });
    // Card 2 of pair
    deck.push({
      id: `${type.pairId}_b_${typeIndex}`,
      pairId: type.pairId,
      name: type.name,
      icon: type.icon,
      accentColor: type.accentColor,
      isFlipped: false,
      isMatched: false,
    });
  });

  return shuffleCards(deck);
}

/** Check if all pairs in deck have been matched */
export function isMemoryComplete(deck: MemoryCardItem[]): boolean {
  return deck.length > 0 && deck.every((card) => card.isMatched);
}
