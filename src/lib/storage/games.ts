import type { GameState, OpenGamesList } from '../types/game.ts';
import type { KVStorage } from './kv.ts';

const KEYS = {
  GAME: (gameId: string) => `game:${gameId}`,
  OPEN_GAMES: 'games:open',
  PLAYER_GAME: (playerId: string) => `player:${playerId}:game`
};

export class GameStorage {
  constructor(private kv: KVStorage) {}

  /**
   * Get a specific game by ID
   */
  async getGame(gameId: string): Promise<GameState | null> {
    return await this.kv.get<GameState>(KEYS.GAME(gameId));
  }

  /**
   * Save/update a game
   */
  async saveGame(game: GameState): Promise<void> {
    // Save the game
    await this.kv.put(KEYS.GAME(game.gameId), game);

    // Update player-to-game mappings
    await this.kv.put(KEYS.PLAYER_GAME(game.player1.id), game.gameId, 3600); // 1 hour TTL
    if (game.player2) {
      await this.kv.put(KEYS.PLAYER_GAME(game.player2.id), game.gameId, 3600);
    }

    // Update open games list if needed
    await this.updateOpenGamesList(game);
  }

  /**
   * Delete a game
   */
  async deleteGame(gameId: string): Promise<void> {
    const game = await this.getGame(gameId);
    if (!game) return;

    // Remove the game
    await this.kv.delete(KEYS.GAME(gameId));

    // Remove player mappings
    await this.kv.delete(KEYS.PLAYER_GAME(game.player1.id));
    if (game.player2) {
      await this.kv.delete(KEYS.PLAYER_GAME(game.player2.id));
    }

    // Update open games list
    await this.removeFromOpenGamesList(gameId);
  }

  /**
   * Get all open games (waiting for players)
   */
  async getOpenGames(): Promise<GameState[]> {
    const openGamesList = await this.kv.get<OpenGamesList>(KEYS.OPEN_GAMES);
    if (!openGamesList || !openGamesList.games) {
      return [];
    }

    // Filter out stale entries and return only pending games
    const now = Date.now();
    const recentGames = openGamesList.games.filter(
      game => game.status === 'PENDING' && now - game.createdAt < 300000 // 5 minutes
    );

    // Update the list if we filtered anything out
    if (recentGames.length !== openGamesList.games.length) {
      await this.kv.put(KEYS.OPEN_GAMES, {
        games: recentGames,
        lastUpdated: now
      });
    }

    return recentGames;
  }

  /**
   * Find what game a player is currently in
   */
  async findPlayerGame(playerId: string): Promise<string | null> {
    return await this.kv.get<string>(KEYS.PLAYER_GAME(playerId));
  }

  /**
   * Update the open games list
   */
  private async updateOpenGamesList(game: GameState): Promise<void> {
    const openGamesList = (await this.kv.get<OpenGamesList>(KEYS.OPEN_GAMES)) || {
      games: [],
      lastUpdated: Date.now()
    };

    // Remove this game from the list first
    openGamesList.games = openGamesList.games.filter(g => g.gameId !== game.gameId);

    // Add it back if it's still pending
    if (game.status === 'PENDING') {
      openGamesList.games.push(game);
    }

    openGamesList.lastUpdated = Date.now();
    await this.kv.put(KEYS.OPEN_GAMES, openGamesList);
  }

  /**
   * Remove a game from open games list
   */
  private async removeFromOpenGamesList(gameId: string): Promise<void> {
    const openGamesList = await this.kv.get<OpenGamesList>(KEYS.OPEN_GAMES);
    if (!openGamesList) return;

    openGamesList.games = openGamesList.games.filter(g => g.gameId !== gameId);
    openGamesList.lastUpdated = Date.now();

    await this.kv.put(KEYS.OPEN_GAMES, openGamesList);
  }
}
