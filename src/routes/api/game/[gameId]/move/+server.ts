import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import { GameStorage } from '$lib/storage/games.ts';
import { HistoryStorage } from '$lib/storage/history.ts';
import { makeMove } from '$lib/game/logic.ts';
import { validateMove, GameValidationError } from '$lib/game/validation.ts';
import { getPlayerSymbol, getCurrentPlayer } from '$lib/game/state.ts';
import { WebSocketNotificationHelper } from '$lib/server/WebSocketNotificationHelper.js';

interface MoveRequest {
  playerId: string;
  cellPosition: number;
}

export const POST: RequestHandler = async ({ params, request, platform }) => {
  try {
    const { gameId } = params;
    const { playerId, cellPosition } = await request.json() as MoveRequest;

    const kv = new KVStorage(platform!);
    const gameStorage = new GameStorage(kv);
    const historyStorage = new HistoryStorage(kv);

    const gameState = await gameStorage.getGame(gameId);
    if (!gameState) {
      return json({ error: 'Game not found' }, { status: 404 });
    }

    // Validate the move
    try {
      validateMove(gameState, playerId, cellPosition);
    } catch (error) {
      if (error instanceof GameValidationError) {
        return json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    // Get player symbol and make the move
    const playerSymbol = getPlayerSymbol(gameState, playerId);
    if (!playerSymbol) {
      return json({ error: 'Player not in game' }, { status: 400 });
    }

    const moveResult = makeMove(playerSymbol, cellPosition, gameState.board);

    const updatedGame = {
      ...gameState,
      board: moveResult.boardData,
      status: moveResult.status,
      lastPlayer: playerSymbol,
      lastMoveAt: Date.now()
    };

    await gameStorage.saveGame(updatedGame);

    // If game is complete, add to history
    if (moveResult.status !== 'ACTIVE') {
      await historyStorage.addGameToHistory(updatedGame);
    }

    await WebSocketNotificationHelper.sendGameUpdate(updatedGame, platform!);

    const nextPlayer = getCurrentPlayer(updatedGame);

    return json({
      ...updatedGame,
      nextPlayer,
      winningPositions: moveResult.winningPositions,
      lastPlayer: updatedGame.lastPlayer,
      lastMoveAt: updatedGame.lastMoveAt
    });
  } catch (error) {
    console.error('Error in /api/game/[gameId]/move:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
