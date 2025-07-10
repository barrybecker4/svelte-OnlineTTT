import type { GameState, PlayerSymbol } from '../types/game.ts';

export class GameValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameValidationError';
  }
}

/**
 * Validate that a move is legal
 */
export function validateMove(game: GameState, playerId: string, cellPosition: number): void {
  // Check if game is active
  if (game.status !== 'ACTIVE') {
    throw new GameValidationError('Game is not active');
  }

  // Check if it's this player's turn
  const playerSymbol = getPlayerSymbolById(game, playerId);
  if (!playerSymbol) {
    throw new GameValidationError('Player not in this game');
  }

  if (!isPlayerTurn(game, playerSymbol)) {
    throw new GameValidationError('Not your turn');
  }

  // Check if cell position is valid
  if (cellPosition < 0 || cellPosition > 8) {
    throw new GameValidationError('Invalid cell position');
  }

  // Check if cell is empty
  if (game.board.charAt(cellPosition) !== '_') {
    throw new GameValidationError('Cell is already occupied');
  }
}

function getPlayerSymbolById(game: GameState, playerId: string): PlayerSymbol | null {
  if (game.player1.id === playerId) return game.player1.symbol;
  if (game.player2?.id === playerId) return game.player2.symbol;
  return null;
}

function isPlayerTurn(game: GameState, playerSymbol: PlayerSymbol): boolean {
  if (game.lastPlayer === '') return playerSymbol === 'X';
  return game.lastPlayer !== playerSymbol;
}
