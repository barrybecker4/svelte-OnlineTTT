import type {  GameStatus, MoveResult, PlayerSymbol } from '../types/game.ts';

/**
 * Determines the new board state after a player makes a move
 */
export function makeMove(playerSymbol: PlayerSymbol, cellPos: number, currentBoard: string): MoveResult {
  if (cellPos < 0 || cellPos > 8) {
    throw new Error('Invalid cell position. Must be 0-8.');
  }

  if (currentBoard.charAt(cellPos) !== '_') {
    throw new Error(`Cannot play in occupied position (${currentBoard.charAt(cellPos)})!`);
  }

  // Make the move
  const newBoard = currentBoard.substring(0, cellPos) + playerSymbol + currentBoard.substring(cellPos + 1);
  const winningPositions = checkForWin(newBoard);
  const status = determineGameStatus(winningPositions, newBoard);

  return {
    status,
    winningPositions,
    boardData: newBoard,
    nextPlayer: playerSymbol === 'X' ? 'O' : 'X'
  };
}

function determineGameStatus(winningPositions: number[] | null, newBoard: string): GameStatus {
  const isTie = !winningPositions && !hasEmptyPositions(newBoard);
  let status: GameStatus;
  if (isTie) {
    status = 'TIE';
  } else if (winningPositions) {
    status = newBoard[winningPositions[0]] === 'X' ? 'X_WIN' : 'O_WIN';
  } else {
    status = 'ACTIVE';
  }
  return status
}

/**
 * Check if the board has any empty positions
 */
function hasEmptyPositions(board: string): boolean {
  return board.includes('_');
}

/**
 * Check for winning conditions on the board
 * Returns array of winning positions, or null if no win
 */
function checkForWin(board: string): number[] | null {
  return checkRows(board) || checkColumns(board) || checkDiagonals(board);
}

/**
 * Check all rows for three in a row
 */
function checkRows(board: string): number[] | null {
  for (let i = 0; i < 3; i++) {
    const row = i * 3;
    const positions = [row, row + 1, row + 2];
    if (checkTriple(positions, board)) {
      return positions;
    }
  }
  return null;
}

/**
 * Check all columns for three in a row
 */
function checkColumns(board: string): number[] | null {
  for (let i = 0; i < 3; i++) {
    const positions = [i, i + 3, i + 6];
    if (checkTriple(positions, board)) {
      return positions;
    }
  }
  return null;
}

/**
 * Check both diagonals for three in a row
 */
function checkDiagonals(board: string): number[] | null {
  const diagonal1 = [0, 4, 8];
  const diagonal2 = [2, 4, 6];

  if (checkTriple(diagonal1, board)) {
    return diagonal1;
  }

  if (checkTriple(diagonal2, board)) {
    return diagonal2;
  }

  return null;
}

/**
 * Check if three positions contain the same non-empty symbol
 */
function checkTriple(positions: number[], board: string): boolean {
  const first = board.charAt(positions[0]);
  return first !== '_' && first === board[positions[1]] && first === board[positions[2]];
}

/**
 * Get the opposite player symbol
 */
export function getOtherPlayer(symbol: PlayerSymbol): PlayerSymbol {
  return symbol === 'X' ? 'O' : 'X';
}

/**
 * Create an empty TTT board
 */
export function createEmptyBoard(): string {
  return '_________';
}
