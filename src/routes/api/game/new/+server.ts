import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';  // <- Note the $lib prefix
import { GameStorage } from '$lib/storage/games.ts';
import { createNewGame, addPlayer2ToGame } from '$lib/game/state.ts';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { playerName } = await request.json();

		if (!playerName || typeof playerName !== 'string') {
			return json({ error: 'Player name is required' }, { status: 400 });
		}

		const kv = new KVStorage(platform!);
		const gameStorage = new GameStorage(kv);

		// Check if player is already in a game
		const playerId = generatePlayerId(playerName);
		const existingGameId = await gameStorage.findPlayerGame(playerId);

		if (existingGameId) {
			const existingGame = await gameStorage.getGame(existingGameId);
			if (existingGame && (existingGame.status === 'PENDING' || existingGame.status === 'ACTIVE')) {
				return json({
					gameId: existingGameId,
					player1: existingGame.player1.name,
					player2: existingGame.player2?.name || null,
					status: existingGame.status
				});
			}
		}

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

			return json({
				gameId: updatedGame.gameId,
				player1: updatedGame.player1.name,
				player2: updatedGame.player2!.name,
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
				status: 'PENDING'
			});
		}

	} catch (error) {
		console.error('Error in /api/game/new:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

function generatePlayerId(playerName: string): string {
	// Simple player ID generation based on name
	// In a real app, you'd use proper session management
	return `player_${playerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}
