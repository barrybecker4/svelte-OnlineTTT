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

  console.log('Platform env keys:', Object.keys(platform?.env || {}));
  console.log('WEBSOCKET_HIBERNATION_SERVER exists:', !!platform?.env.WEBSOCKET_HIBERNATION_SERVER);
  console.log('Platform env keys:', Object.keys(platform?.env || {}));
  console.log('Full platform object keys:', Object.keys(platform || {}));
  console.log('WEBSOCKET_HIBERNATION_SERVER:', platform?.env.WEBSOCKET_HIBERNATION_SERVER);
  console.log('Any WEBSOCKET services:', Object.keys(platform?.env || {}).filter(key => key.includes('WEBSOCKET')));
  console.log('WebSocket service available: ', platform?.env.WEBSOCKET_HIBERNATION_SERVER);

	const kv = new KVStorage(platform!);
	const gameStorage = new GameStorage(kv);
	const isLocal = isLocalDevelopment(platform);

	// Look for open games
	const openGames = await gameStorage.getOpenGames();
	const availableGame = openGames.find(game => 
		game.player1.name !== playerName && // Don't match with yourself
		!game.player2
	);

	if (availableGame) {
		// Join existing game as player 2
		const updatedGame = addPlayer2ToGame(availableGame, playerName);
		await gameStorage.saveGame(updatedGame);
		
		// Handle WebSocket notifications based on environment
		if (isLocal) {
			console.log('🏠 LOCAL DEV: Using polling for game updates (WebSocket notifications disabled)');
			console.log('   ℹ️  Player 2 joined - updates will sync via polling every 2 seconds');
		} else {
			try {
				console.log('🚀 PRODUCTION: Sending instant WebSocket notification...');
				await notifyPlayerJoined(updatedGame.gameId, updatedGame, platform!.env.WEBSOCKET_HIBERNATION_SERVER);
				console.log('✅ WebSocket notification sent successfully');
			} catch (error) {
				console.error('❌ WebSocket notification failed in production:', error);
			}
		}

		return json({
			gameId: updatedGame.gameId,
			player1: updatedGame.player1.name,
			player2: updatedGame.player2!.name,
			playerId: updatedGame.player2!.id,
			playerSymbol: 'O',
			status: 'ACTIVE'
		});
	} else {
		// Create new game as player 1
		const newGame = createNewGame(playerName);
		await gameStorage.saveGame(newGame);

		if (isLocal) {
			console.log('🏠 LOCAL DEV: Game created - waiting for player 2 (will detect via polling)');
		} else {
			console.log('🚀 PRODUCTION: Game created - WebSocket notifications enabled');
		}

		return json({
			gameId: newGame.gameId,
			player1: newGame.player1.name,
			player2: null,
			playerId: newGame.player1.id,
			playerSymbol: 'X',
			status: 'PENDING'
		});
	}
};
