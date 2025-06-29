import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import { GameStorage } from '$lib/storage/games.ts';
import { HistoryStorage } from '$lib/storage/history.ts';
import { terminateGame, getPlayerSymbol } from '$lib/game/state.ts';
import { WebSocketNotificationService } from '$lib/server/WebSocketNotificationService.js';

interface QuitRequest {
  playerId: string;
  reason?: 'RESIGN' | 'TIMEOUT';
}

export const POST: RequestHandler = async ({ params, request, platform }) => {
  try {
    const { gameId } = params;
    const { playerId, reason = 'RESIGN' } = await request.json() as QuitRequest;;

    const kv = new KVStorage(platform!);
    const gameStorage = new GameStorage(kv);
    const historyStorage = new HistoryStorage(kv);

    const game = await gameStorage.getGame(gameId);
    if (!game) {
      return json({ error: 'Game not found' }, { status: 404 });
    }

    const playerSymbol = getPlayerSymbol(game, playerId);
    if (!playerSymbol) {
      return json({ error: 'Player not in game' }, { status: 400 });
    }

    if (game.status === 'PENDING' && !game.player2) {
      // Player is leaving before game started - just delete the game
      await gameStorage.deleteGame(gameId);
      return json({ message: 'Game deleted' });
    } else {
      // Player is resigning from active game
      const updatedGame = terminateGame(game, playerSymbol, reason);
      await gameStorage.saveGame(updatedGame);
      await historyStorage.addGameToHistory(updatedGame);

      // Send WebSocket notification to inform other player about the quit/timeout
      if (platform?.env.WEBSOCKET_HIBERNATION_SERVER) {
        try {
          console.log(
            `🚨 Sending WebSocket notification for player quit/timeout - game: ${gameId}, player: ${playerSymbol}, reason: ${reason}`
          );
          await WebSocketNotificationService.notifyGameUpdate(updatedGame.gameId, updatedGame, platform.env.WEBSOCKET_HIBERNATION_SERVER);
          console.log('✅ WebSocket notification sent successfully for quit/timeout');
        } catch (error) {
          console.error('❌ Failed to send WebSocket notification for quit/timeout:', error);
          // Continue anyway - the game state is still updated
        }
      } else {
        console.log('🏠 LOCAL DEV: Quit/timeout notification skipped (WebSocket notifications disabled)');
      }

      return json({
        gameId: updatedGame.gameId,
        status: updatedGame.status,
        board: updatedGame.board,
        lastPlayer: updatedGame.lastPlayer,
        lastMoveAt: updatedGame.lastMoveAt,
        message: `Player ${playerSymbol} ${reason.toLowerCase()}`
      });
    }
  } catch (error) {
    console.error('Error in /api/game/[gameId]/quit:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
