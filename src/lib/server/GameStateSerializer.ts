import type { GameState } from '../types/game.js';

export interface SerializedGameState {
  gameId: string;
  board: string;
  status: string;
  player1: {
    id: string;
    name: string;
    symbol: string;
  };
  player2: {
    id: string;
    name: string;
    symbol: string;
  } | null;
  lastPlayer: string;
  lastMoveAt: number;
}

/**
 * Serializes a GameState object to avoid DataCloneError when sending over WebSocket
 * Only includes serializable fields needed for client updates
 */
export function serializeGameState(gameState: GameState): SerializedGameState {
  return {
    gameId: gameState.gameId,
    board: gameState.board,
    status: gameState.status,
    player1: {
      id: gameState.player1.id,
      name: gameState.player1.name,
      symbol: gameState.player1.symbol
    },
    player2: gameState.player2 ? {
      id: gameState.player2.id,
      name: gameState.player2.name,
      symbol: gameState.player2.symbol
    } : null,
    lastPlayer: gameState.lastPlayer,
    lastMoveAt: gameState.lastMoveAt
  };
}

export function calculateNextPlayer(lastPlayer: string): 'X' | 'O' {
  return lastPlayer === '' ? 'X' : lastPlayer === 'X' ? 'O' : 'X';
}

/**
 * Creates a serialized game update with next player calculation
 */
export function createGameUpdateData(gameState: GameState): SerializedGameState & { nextPlayer: 'X' | 'O' } {
  const serialized = serializeGameState(gameState);
  return {
    ...serialized,
    nextPlayer: calculateNextPlayer(gameState.lastPlayer)
  };
}

/**
 * Creates a serialized player joined data (game just started, X goes first)
 */
export function createPlayerJoinedData(gameState: GameState): SerializedGameState & { nextPlayer: 'X' } {
  const serialized = serializeGameState(gameState);
  return {
    ...serialized,
    nextPlayer: 'X' // Game just started, X goes first
  };
}
