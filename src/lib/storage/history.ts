import type { GameHistory, GameState } from '../types/game.ts';
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

    return {  // empty history if none exists
      player1,
      player2,
      totalEncounters: 0,
      totalActive: 0,
      player1AsX: this.createEmptyPlayerStats(),
      player1AsO: this.createEmptyPlayerStats(),
      player2AsX: this.createEmptyPlayerStats(),
      player2AsO: this.createEmptyPlayerStats(),
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

    // Update stats based on who was X and what happened
    this.updateHistoryStats(history, game);
    await this.kv.put(KEYS.HISTORY(player1Name, player2Name), history);
  }

  /**
   * Update history statistics
   */
  private updateHistoryStats(history: GameHistory, game: GameState): void {
    history.totalEncounters++;

    // Update stats based on WHO played which symbol and the outcome
    const xPlayerName = game.player1.symbol === 'X' ? game.player1.name : game.player2!.name;
    const oPlayerName = game.player1.symbol === 'O' ? game.player1.name : game.player2!.name;

    // Figure out which stats buckets correspond to each player
    const xPlayerIsHistoryPlayer1 = history.player1 === xPlayerName;
    const oPlayerIsHistoryPlayer1 = history.player1 === oPlayerName;

    // Get the correct stats buckets
    // If X player is history.player1, use player1AsX for X stats
    // And if O player is history.player1, use player2AsX for O stats (because player1 is playing O, not X)
    const xPlayerStats = xPlayerIsHistoryPlayer1 ? history.player1AsX : history.player2AsX;
    const oPlayerStats = oPlayerIsHistoryPlayer1 ? history.player1AsO : history.player2AsO;

    // Update stats based on game outcome
    switch (game.status) {
      case 'TIE':
        xPlayerStats.totalTies++;
        oPlayerStats.totalTies++;
        break;

      case 'X_WIN':
        xPlayerStats.totalWins++;
        oPlayerStats.totalLosses++;
        break;

      case 'X_BY_RESIGN':
        xPlayerStats.totalWins++;
        xPlayerStats.wins.byResignation++;
        oPlayerStats.totalLosses++;
        oPlayerStats.losses.byResignation++;
        break;

      case 'X_BY_TIMEOUT':
        xPlayerStats.totalWins++;
        xPlayerStats.wins.byTimeout++;
        oPlayerStats.totalLosses++;
        oPlayerStats.losses.byTimeout++;
        break;

      case 'O_WIN':
        oPlayerStats.totalWins++;
        xPlayerStats.totalLosses++;
        break;

      case 'O_BY_RESIGN':
        oPlayerStats.totalWins++;
        oPlayerStats.wins.byResignation++;
        xPlayerStats.totalLosses++;
        xPlayerStats.losses.byResignation++;
        break;

      case 'O_BY_TIMEOUT':
        oPlayerStats.totalWins++;
        oPlayerStats.wins.byTimeout++;
        xPlayerStats.totalLosses++;
        xPlayerStats.losses.byTimeout++;
        break;
    }
    console.log(xPlayerIsHistoryPlayer1, 'xPlayerStats=', xPlayerStats, ' ', oPlayerIsHistoryPlayer1, ' oPlayerStats=', oPlayerStats);
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
