import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import { GameStorage } from '$lib/storage/games.ts';
import { HistoryStorage } from '$lib/storage/history.ts';
import { makeMove } from '$lib/game/logic.ts';
import { validateMove, GameValidationError } from '$lib/game/validation.ts';
import { getPlayerSymbol, getCurrentPlayer } from '$lib/game/state.ts';
import { WebSocketNotificationService } from '$lib/server/WebSocketNotificationService.js';

interface MoveRequest {
  playerId: string;
  cellPosition: number;
}

export const POST: RequestHandler = async ({ params, request, platform }) => {
  try {
    const { gameId } = params;
    const { playerId, cellPosition } = await request.json() as MoveRequest;;

    const kv = new KVStorage(platform!);
    const gameStorage = new GameStorage(kv);
    const historyStorage = new HistoryStorage(kv);

    const game = await gameStorage.getGame(gameId);
    if (!game) {
      return json({ error: 'Game not found' }, { status: 404 });
    }

    // Validate the move
    try {
      validateMove(game, playerId, cellPosition);
    } catch (error) {
      if (error instanceof GameValidationError) {
        return json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    // Get player symbol and make the move
    const playerSymbol = getPlayerSymbol(game, playerId);
    if (!playerSymbol) {
      return json({ error: 'Player not in game' }, { status: 400 });
    }

    const moveResult = makeMove(playerSymbol, cellPosition, game.board);

    // Update game state
    const updatedGame = {
      ...game,
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

    // Send WebSocket notification to all players in the game
    if (platform?.env.WEBSOCKET_HIBERNATION_SERVER) {
      try {
        await WebSocketNotificationService.notifyGameUpdate(updatedGame.gameId, updatedGame, platform.env.WEBSOCKET_HIBERNATION_SERVER);
      } catch (error) {
        console.error('Failed to send WebSocket notification:', error);
        // Don't fail the request if WebSocket notification fails
      }
    }

    const nextPlayer = getCurrentPlayer(updatedGame);

    return json({
      gameId: updatedGame.gameId,
      board: updatedGame.board,
      status: updatedGame.status,
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
