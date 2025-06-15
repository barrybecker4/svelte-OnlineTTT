import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import { GameStorage } from '$lib/storage/games.ts';
import { createNewGame, addPlayer2ToGame } from '$lib/game/state.ts';
import { notifyPlayerJoined } from '$lib/server/websocket.ts';

export const POST: RequestHandler = async ({ request, platform }) => {
	const { playerName } = await request.json();
	
	if (!playerName) {
		return json({ error: 'Player name required' }, { status: 400 });
	}

	const kv = new KVStorage(platform!);
	const gameStorage = new GameStorage(kv);

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
		
		// Notify player 1 that player 2 has joined via WebSocket
		if (platform?.env.WEBSOCKET_HIBERNATION_SERVER) {
			try {
				await notifyPlayerJoined(updatedGame.gameId, updatedGame, platform.env.WEBSOCKET_HIBERNATION_SERVER);
			} catch (error) {
				console.error('Failed to send WebSocket notification for player joined:', error);
			}
		}
		
		return json({
			gameId: updatedGame.gameId,
			player1: updatedGame.player1.name,
			player2: updatedGame.player2!.name,
			playerId: updatedGame.player2!.id, // Return the actual player ID
			playerSymbol: 'O',
			status: 'ACTIVE'
		});
	} else {
		// Create new game as player 1
		const newGame = createNewGame(playerName);
		await gameStorage.saveGame(newGame);
		
		return json({
			gameId: newGame.gameId,
			player1: newGame.player1.name,
			player2: null,
			playerId: newGame.player1.id, // Return the actual player ID
			playerSymbol: 'X',
			status: 'PENDING'
		});
	}
};
