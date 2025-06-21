import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import { GameStorage } from '$lib/storage/games.ts';
import { getCurrentPlayer } from '$lib/game/state.ts';

export const GET: RequestHandler = async ({ params, platform }) => {
  try {
    const { gameId } = params;

    const kv = new KVStorage(platform!);
    const gameStorage = new GameStorage(kv);

    const game = await gameStorage.getGame(gameId);
    if (!game) {
      return json({ error: 'Game not found' }, { status: 404 });
    }

    const nextPlayer = getCurrentPlayer(game);

    return json({
      gameId: game.gameId,
      board: game.board,
      status: game.status,
      player1: game.player1.name,
      player1Id: game.player1.id, // Include player1 ID
      player2: game.player2?.name || null,
      player2Id: game.player2?.id || null, // Include player2 ID
      nextPlayer,
      lastPlayer: game.lastPlayer,
      lastMoveAt: game.lastMoveAt
    });
  } catch (error) {
    console.error('Error in /api/game/[gameId]:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
