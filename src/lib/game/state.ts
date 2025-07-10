import { v4 as uuidv4 } from 'uuid';
import type { GameState, Player, PlayerSymbol } from '../types/game.ts';
import { createEmptyBoard } from './logic.js';

/**
 * Create a new game with player1, waiting for player2
 * Migrated from createNewGame() in games.gs
 */
export function createNewGame(player1Name: string): GameState {
  const player1: Player = {
    id: generatePlayerId(),
    symbol: 'X',
    name: player1Name
  };

  return {
    gameId: uuidv4(),
    board: createEmptyBoard(),
    status: 'PENDING',
    player1,
    lastPlayer: '',
    createdAt: Date.now(),
    lastMoveAt: Date.now()
  };
}

/**
 * Add player2 to an existing game and mark them as active
 */
export function addPlayer2ToGame(game: GameState, player2Name: string): GameState {
  const player2: Player = {
    id: generatePlayerId(),
    symbol: 'O',
    name: player2Name
  };

  return {
    ...game,
    player2,
    status: 'ACTIVE',
    lastMoveAt: Date.now()
  };
}

/**
 * Mark a game as terminated by resignation or timeout
 */
export function terminateGame(game: GameState, resigningPlayer: PlayerSymbol, reason: 'RESIGN' | 'TIMEOUT'): GameState {
  const winningPlayer = resigningPlayer === 'X' ? 'O' : 'X';
  const status = `${winningPlayer}_BY_${reason}` as const;

  return {
    ...game,
    status,
    lastPlayer: resigningPlayer,
    lastMoveAt: Date.now()
  };
}

/**
 * Get the player whose turn it is (or would be once game starts)
 */
export function getCurrentPlayer(game: GameState): PlayerSymbol | null {
  // For PENDING games, X should go first when the game starts
  if (game.status === 'PENDING') return 'X';

  // For non-active games (finished games), return null
  if (game.status !== 'ACTIVE') return null;

  // For active games, use the normal logic
  if (game.lastPlayer === '') return 'X';

  return game.lastPlayer === 'X' ? 'O' : 'X';
}

/**
 * Generate a unique player ID
 */
function generatePlayerId(): string {
  return uuidv4().substring(0, 8);
}

/**
 * Get player symbol by player ID
 */
export function getPlayerSymbol(game: GameState, playerId: string): PlayerSymbol | null {
  if (game.player1.id === playerId) return game.player1.symbol;
  if (game.player2?.id === playerId) return game.player2.symbol;
  return null;
}
