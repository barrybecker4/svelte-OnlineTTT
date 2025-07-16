import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import { GameStorage } from '$lib/storage/games.ts';
import { createNewGame, addPlayer2ToGame } from '$lib/game/state.ts';
import { WebSocketNotificationHelper } from '$lib/server/WebSocketNotificationHelper.js';
import type { GameState } from '$lib/types/game.ts';

interface NewGameRequest {
  playerName: string;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const { playerName } = await request.json() as NewGameRequest;

  console.log(`🎯 NEW GAME REQUEST: Player "${playerName}" wants to play`);

  if (!playerName) {
    return json({ error: 'Player name required' }, { status: 400 });
  }

  const kv = new KVStorage(platform!);
  const gameStorage = new GameStorage(kv);

  const envInfo = WebSocketNotificationHelper.getEnvironmentInfo(platform!);
  console.log('🌍 Environment detection:', envInfo);

  try {
    await gameStorage.cleanupOpenGamesList();
    const openGames = await gameStorage.getOpenGames();
    console.log(`📋 Found ${openGames.length} open games after cleanup`);

    const availableGame = await findAvailableGame(openGames);

    if (availableGame) {
      const json = await getJsonForGame(availableGame);
      if (json) return json;
    }

    // No available game found - create new game
    return createTheNewGame();

  } catch (error) {
    console.error('❌ ERROR in /api/game/new:', error);
    return json({ error: 'Failed to create or join game' }, { status: 500 });
  }


  function findAvailableGame(openGames: GameState[]): GameState {
    console.log(`🔍 Looking for available game for "${playerName}"...`);

    const availableGames = openGames.filter(game =>
      game.player1.name !== playerName &&
      !game.player2 &&
      game.status === 'PENDING'
    );

    console.log(`🎯 Found ${availableGames.length} games that "${playerName}" can join`);
    availableGames.forEach((game, index) => {
      console.log(`  Available game ${index + 1}: ${game.gameId} (player1: "${game.player1.name}")`);
    });

    return availableGames[0]; // Take the first available game
  }

  async function getJsonForGame(availableGame: GameState) {
    console.log(`🎮 JOINING EXISTING GAME: "${playerName}" joining game ${availableGame.gameId} with "${availableGame.player1.name}"`);

    // Double-check that the game is still available by fetching fresh data
    const freshGame = await gameStorage.getGame(availableGame.gameId);
    if (!freshGame) {
      console.log(`❌ Game ${availableGame.gameId} no longer exists, creating new game instead`);
    } else if (freshGame.status !== 'PENDING') {
      console.log(`❌ Game ${availableGame.gameId} is no longer PENDING (status: ${freshGame.status}), creating new game instead`);
    } else if (freshGame.player2) {
      console.log(`❌ Game ${availableGame.gameId} already has player2, creating new game instead`);
    } else {
      // Game is still available - join it!
      console.log(`✅ Game ${availableGame.gameId} is still available, adding "${playerName}" as player2`);

      const updatedGame = addPlayer2ToGame(freshGame, playerName);
      await gameStorage.saveGame(updatedGame);

      console.log(`🎉 GAME NOW ACTIVE: ${updatedGame.gameId}`);
      console.log(`   Player 1: "${updatedGame.player1.name}" (${updatedGame.player1.id})`);
      console.log(`   Player 2: "${updatedGame.player2!.name}" (${updatedGame.player2!.id})`);
      console.log(`   Status: ${updatedGame.status}`);

      // Send WebSocket notification about player joining
      console.log(`📡 Sending playerJoined notification...`);
      await WebSocketNotificationHelper.sendPlayerJoined(updatedGame, platform!);

      return json({
        gameId: updatedGame.gameId,
        player1: updatedGame.player1.name,
        player2: updatedGame.player2!.name,
        playerId: updatedGame.player2!.id,
        playerSymbol: 'O',
        status: 'ACTIVE',
        webSocketNotificationsEnabled: envInfo.webSocketNotificationsAvailable
      });
    }
    return null;
  }

  async function createTheNewGame() {
    console.log(`🆕 CREATING NEW GAME: No available games for "${playerName}", creating new game`);

    const newGame = createNewGame(playerName);
    await gameStorage.saveGame(newGame);

    console.log(`✅ NEW GAME CREATED: ${newGame.gameId}`);
    console.log(`   Player 1: "${newGame.player1.name}" (${newGame.player1.id})`);
    console.log(`   Status: ${newGame.status} (waiting for player 2)`);

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

