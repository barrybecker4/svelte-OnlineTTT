import type { GameHistory, GameHistoryEntry, GameState } from '../types/game.ts';
import type { KVStorage } from './kv.ts';

const KEYS = {
	HISTORY: (player1: string, player2: string) => {
		// Always put players in alphabetical order for consistent keys
		const [p1, p2] = [player1, player2].sort();
		return `history:${p1}:${p2}`;
	}
};

export class HistoryStorage {
	constructor(private kv: KVStorage) {}

	/**
	 * Get game history between two players
	 */
	async getHistory(player1: string, player2: string): Promise<GameHistory> {
		const existing = await this.kv.get<GameHistory>(KEYS.HISTORY(player1, player2));

		if (existing) {
			return existing;
		}

		// Return empty history if none exists
		return {
			player1,
			player2,
			totalEncounters: 0,
			totalActive: 0,
			player1AsX: this.createEmptyPlayerStats(),
			player2AsX: this.createEmptyPlayerStats()
		};
	}

	/**
	 * Add a completed game to history
	 */
	async addGameToHistory(game: GameState): Promise<void> {
		if (!game.player2 || game.status === 'PENDING' || game.status === 'ACTIVE') {
			return; // Only record completed games
		}

		const player1Name = game.player1.name;
		const player2Name = game.player2.name;

		const history = await this.getHistory(player1Name, player2Name);

		// Add this game to the history
		const historyEntry: GameHistoryEntry = {
			gameId: game.gameId,
			status: game.status,
			completedAt: game.lastMoveAt
		};

		// Update stats based on who was X and what happened
		this.updateHistoryStats(history, game, historyEntry);

		// Save updated history
		await this.kv.put(KEYS.HISTORY(player1Name, player2Name), history);
	}

	/**
	 * Update history statistics
	 */
	private updateHistoryStats(
		history: GameHistory,
		game: GameState,
		entry: GameHistoryEntry
	): void {
		history.totalEncounters++;

		// Determine which player was X in this game
		const player1WasX = game.player1.symbol === 'X';
		const player1Stats = player1WasX ? history.player1AsX : history.player2AsX;
		const player2Stats = player1WasX ? history.player2AsX : history.player1AsX;

		// Update stats based on game outcome
		switch (game.status) {
			case 'TIE':
				player1Stats.totalTies++;
				player2Stats.totalTies++;
				break;

			case 'X_WIN':
				player1Stats.totalWins++;
				player2Stats.totalLosses++;
				break;

			case 'X_BY_RESIGN':
				player1Stats.totalWins++;
				player1Stats.wins.byResignation++;
				player2Stats.totalLosses++;
				player2Stats.losses.byResignation++;
				break;

			case 'X_BY_TIMEOUT':
				player1Stats.totalWins++;
				player1Stats.wins.byTimeout++;
				player2Stats.totalLosses++;
				player2Stats.losses.byTimeout++;
				break;

			case 'O_WIN':
				player1Stats.totalLosses++;
				player2Stats.totalWins++;
				break;

			case 'O_BY_RESIGN':
				player1Stats.totalLosses++;
				player1Stats.losses.byResignation++;
				player2Stats.totalWins++;
				player2Stats.wins.byResignation++;
				break;

			case 'O_BY_TIMEOUT':
				player1Stats.totalLosses++;
				player1Stats.losses.byTimeout++;
				player2Stats.totalWins++;
				player2Stats.wins.byTimeout++;
				break;
		}
	}

	private createEmptyPlayerStats() {
		return {
			totalWins: 0,
			totalLosses: 0,
			totalTies: 0,
			wins: {
				byResignation: 0,
				byTimeout: 0
			},
			losses: {
				byResignation: 0,
				byTimeout: 0
			}
		};
	}
}
