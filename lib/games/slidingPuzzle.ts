/**
 * Pure Game Logic for Sliding Puzzle
 * Ported from the original Sliding puzzle implementation.
 *
 * Grid is 4x4 with 15 numbered tiles (1-15) and 0 representing the empty slot.
 */

export const GRID_SIZE = 4;
export const TOTAL_TILES = GRID_SIZE * GRID_SIZE; // 16

/** Generate solved board: [1, 2, ..., 15, 0] */
export function createSolvedBoard(): number[] {
  const board = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => i + 1);
  board.push(0);
  return board;
}

/** Swap elements in an array immutably */
export function swapTiles(board: number[], indexA: number, indexB: number): number[] {
  const newBoard = [...board];
  const temp = newBoard[indexA];
  newBoard[indexA] = newBoard[indexB];
  newBoard[indexB] = temp;
  return newBoard;
}

/** Check if two indices in 4x4 grid are orthogonal neighbours (above, below, left, right) */
export function isAdjacent(indexA: number, indexB: number): boolean {
  const rowA = Math.floor(indexA / GRID_SIZE);
  const colA = indexA % GRID_SIZE;
  const rowB = Math.floor(indexB / GRID_SIZE);
  const colB = indexB % GRID_SIZE;

  const sameRow = rowA === rowB;
  const sameCol = colA === colB;
  const colDiff = Math.abs(colA - colB);
  const rowDiff = Math.abs(rowA - rowB);

  return (sameRow && colDiff === 1) || (sameCol && rowDiff === 1);
}

/**
 * Standard 15-puzzle solvability rule:
 * For an even grid width (4):
 * - If blank is on an even row from the bottom (odd row from the top, 1-indexed),
 *   inversions must be odd.
 * - If blank is on an odd row from the bottom (even row from the top, 1-indexed),
 *   inversions must be even.
 */
export function isSolvable(board: number[]): boolean {
  let inversions = 0;
  let blankRowFromTop = 0; // 1-indexed

  for (let i = 0; i < board.length; i++) {
    if (i % GRID_SIZE === 0) {
      blankRowFromTop++;
    }
    if (board[i] === 0) {
      continue;
    }
    for (let j = i + 1; j < board.length; j++) {
      if (board[j] !== 0 && board[i] > board[j]) {
        inversions++;
      }
    }
  }

  // Find row of blank tile from top (1-indexed)
  const emptyIndex = board.indexOf(0);
  const blankRow = Math.floor(emptyIndex / GRID_SIZE) + 1;

  if (blankRow % 2 === 0) {
    return inversions % 2 !== 0;
  } else {
    return inversions % 2 === 0;
  }
}

/** Fisher-Yates shuffle on array immutably */
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

/** Generate a guaranteed solvable, non-already-solved puzzle */
export function createSolvablePuzzle(): number[] {
  let puzzle = shuffleArray(createSolvedBoard());
  while (!isSolvable(puzzle) || isPuzzleSolved(puzzle)) {
    puzzle = shuffleArray(createSolvedBoard());
  }
  return puzzle;
}

/**
 * Attempt to move a tile at clickedIndex into the adjacent empty space.
 * Returns null if the move is invalid.
 */
export function moveTile(
  board: number[],
  clickedIndex: number,
): { newBoard: number[]; emptyIndex: number } | null {
  const emptyIndex = board.indexOf(0);
  if (emptyIndex === -1) return null;

  if (isAdjacent(clickedIndex, emptyIndex)) {
    const newBoard = swapTiles(board, clickedIndex, emptyIndex);
    return { newBoard, emptyIndex };
  }

  return null;
}

/** Check if current board matches the solved state: 1..15, 0 */
export function isPuzzleSolved(board: number[]): boolean {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) {
      return false;
    }
  }
  return board[board.length - 1] === 0;
}
