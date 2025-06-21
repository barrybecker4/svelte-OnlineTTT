import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import { GameStorage } from '$lib/storage/games.ts';
import { createNewGame, addPlayer2ToGame } from '$lib/game/state.ts';
import { notifyPlayerJoined } from '$lib/server/websocket.ts';

function isLocalDevelopment(platform: any): boolean {
	return !platform?.env.WEBSOCKET_HIBERNATION_SERVER;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const { playerName } = await request.json();

  if (!playerName) {
    return json({ error: 'Player name required' }, { status: 400 });
  }

  // Debug logging for environment detection
  console.log('Platform env keys:', Object.keys(platform?.env || {}));
  console.log('WEBSOCKET_HIBERNATION_SERVER exists:', !!platform?.env.WEBSOCKET_HIBERNATION_SERVER);

  const kv = new KVStorage(platform!);
  const gameStorage = new GameStorage(kv);
  const isLocal = !platform?.env.WEBSOCKET_HIBERNATION_SERVER;
  console.log('Environment detection - isLocal:', isLocal, 'WEBSOCKET_HIBERNATION_SERVER available:', !!platform?.env.WEBSOCKET_HIBERNATION_SERVER);

  const openGames = await gameStorage.getOpenGames();
  const availableGame = openGames.find(game =>
    game.player1.name !== playerName && !game.player2
  );

  if (availableGame) {
    const updatedGame = addPlayer2ToGame(availableGame, playerName);
    await gameStorage.saveGame(updatedGame);

    // Handle WebSocket notifications based on environment
    if (platform?.env.WEBSOCKET_HIBERNATION_SERVER) {
      try {
        console.log('🚀 PRODUCTION: Sending instant WebSocket notification...');
        await notifyPlayerJoined(updatedGame.gameId, updatedGame, platform.env.WEBSOCKET_HIBERNATION_SERVER);
        console.log('✅ WebSocket notification sent successfully');
      } catch (error) {
        console.error('❌ WebSocket notification failed:', error);
        // Continue anyway - the game still works with polling
      }
    } else {
      console.log('🏠 LOCAL DEV: Using polling for game updates (WebSocket notifications disabled)');
    }

    return json({
      gameId: updatedGame.gameId,
      player1: updatedGame.player1.name,
      player2: updatedGame.player2!.name,
      playerId: updatedGame.player2!.id,
      playerSymbol: 'O',
      status: 'ACTIVE',
      webSocketNotificationsEnabled: !isLocal
    });
  } else {
    const newGame = createNewGame(playerName);
    await gameStorage.saveGame(newGame);

    const env = isLocal ? '🏠 LOCAL DEV' : '🚀 PRODUCTION';
    console.log(`${env}: Game created - waiting for player 2`);

    return json({
      gameId: newGame.gameId,
      player1: newGame.player1.name,
      player2: null,
      playerId: newGame.player1.id,
      playerSymbol: 'X',
      status: 'PENDING',
      webSocketNotificationsEnabled: !isLocal
    });
  }
};
