import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import { GameStorage } from '$lib/storage/games.ts';
import { createNewGame, addPlayer2ToGame } from '$lib/game/state.ts';
import { WebSocketNotificationHelper } from '$lib/server/WebSocketNotificationHelper.js';

interface NewGameRequest {
  playerName: string;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const { playerName } = await request.json() as NewGameRequest;

  if (!playerName) {
    return json({ error: 'Player name required' }, { status: 400 });
  }

  const kv = new KVStorage(platform!);
  const gameStorage = new GameStorage(kv);

  const envInfo = WebSocketNotificationHelper.getEnvironmentInfo(platform);
  console.log('Environment detection:', envInfo);

  const openGames = await gameStorage.getOpenGames();
  const availableGame = openGames.find(game => game.player1.name !== playerName && !game.player2);

  if (availableGame) {
    const updatedGame = addPlayer2ToGame(availableGame, playerName);
    await gameStorage.saveGame(updatedGame);

    await WebSocketNotificationHelper.sendPlayerJoined(updatedGame, platform);

    return json({
      gameId: updatedGame.gameId,
      player1: updatedGame.player1.name,
      player2: updatedGame.player2!.name,
      playerId: updatedGame.player2!.id,
      playerSymbol: 'O',
      status: 'ACTIVE',
      webSocketNotificationsEnabled: envInfo.webSocketNotificationsAvailable
    });
  } else {
    const newGame = createNewGame(playerName);
    await gameStorage.saveGame(newGame);

    const env = envInfo.isLocalDevelopment ? '🏠 LOCAL DEV' : '🚀 PRODUCTION';
    console.log(`${env}: Game created - waiting for player 2`);

    return json({
      gameId: newGame.gameId,
      player1: newGame.player1.name,
      player2: null,
      playerId: newGame.player1.id,
      playerSymbol: 'X',
      status: 'PENDING',
      webSocketNotificationsEnabled: envInfo.webSocketNotificationsAvailable
    });
  }
};