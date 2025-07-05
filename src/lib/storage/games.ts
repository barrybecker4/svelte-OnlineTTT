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
    console.log(`💾 Saving game ${game.gameId} with status: ${game.status}`);

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

    console.log(`🗑️ Deleting game ${gameId}`);

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
    console.log('📋 Getting open games list...');

    const openGamesList = await this.kv.get<OpenGamesList>(KEYS.OPEN_GAMES);
    if (!openGamesList || !openGamesList.games) {
      console.log('📋 No open games list found, returning empty array');
      return [];
    }

    console.log(`📋 Found ${openGamesList.games.length} games in open games list`);

    // Verify each game's current status by fetching from KV
    const validGames: GameState[] = [];
    const now = Date.now();

    for (const listedGame of openGamesList.games) {
      console.log(`🔍 Checking game ${listedGame.gameId} (listed as ${listedGame.status})`);

      // Fetch the current game state from KV to verify status
      const currentGame = await this.getGame(listedGame.gameId);

      if (currentGame) {
        console.log(`  ✅ Game exists with current status: ${currentGame.status}, has player2: ${!!currentGame.player2}`);

        // Only include if still pending and not stale
        if (currentGame.status === 'PENDING' &&
          !currentGame.player2 &&
          now - currentGame.createdAt < 300000) { // 5 minutes
          validGames.push(currentGame);
          console.log(`  ✅ Game ${listedGame.gameId} is valid for matching`);
        } else {
          console.log(`  ❌ Game ${listedGame.gameId} is not valid (status: ${currentGame.status}, has player2: ${!!currentGame.player2}, age: ${(now - currentGame.createdAt) / 1000}s)`);
        }
      } else {
        console.log(`  ❌ Game ${listedGame.gameId} no longer exists in KV`);
      }
    }

    // Update the list if we filtered anything out
    if (validGames.length !== openGamesList.games.length) {
      console.log(`🧹 Cleaning up open games list: ${openGamesList.games.length} -> ${validGames.length} games`);
      await this.kv.put(KEYS.OPEN_GAMES, {
        games: validGames,
        lastUpdated: now
      });
    }

    console.log(`📋 Returning ${validGames.length} valid open games`);
    return validGames;
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
    console.log(`📝 Updating open games list for game ${game.gameId} (status: ${game.status})`);

    try {
      const openGamesList = (await this.kv.get<OpenGamesList>(KEYS.OPEN_GAMES)) || {
        games: [],
        lastUpdated: Date.now()
      };

      console.log(`📝 Current open games list has ${openGamesList.games.length} games`);

      // Remove this game from the list first (regardless of status)
      const originalCount = openGamesList.games.length;
      openGamesList.games = openGamesList.games.filter(g => g.gameId !== game.gameId);
      const afterRemovalCount = openGamesList.games.length;

      if (originalCount !== afterRemovalCount) {
        console.log(`📝 Removed existing entry for game ${game.gameId}`);
      }

      // Add it back if it's still pending and has no player2
      if (game.status === 'PENDING' && !game.player2) {
        openGamesList.games.push(game);
        console.log(`📝 Added game ${game.gameId} to open games list (player: ${game.player1.name})`);
      } else {
        console.log(`📝 Game ${game.gameId} not added to open games list (status: ${game.status}, has player2: ${!!game.player2})`);
      }

      openGamesList.lastUpdated = Date.now();
      await this.kv.put(KEYS.OPEN_GAMES, openGamesList);

      console.log(`📝 Updated open games list: ${openGamesList.games.length} games`);

    } catch (error) {
      console.error(`❌ Failed to update open games list for game ${game.gameId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a game from open games list
   */
  private async removeFromOpenGamesList(gameId: string): Promise<void> {
    const openGamesList = await this.kv.get<OpenGamesList>(KEYS.OPEN_GAMES);
    if (!openGamesList) return;

    const originalCount = openGamesList.games.length;
    openGamesList.games = openGamesList.games.filter(g => g.gameId !== gameId);
    const newCount = openGamesList.games.length;

    if (originalCount !== newCount) {
      openGamesList.lastUpdated = Date.now();
      await this.kv.put(KEYS.OPEN_GAMES, openGamesList);
      console.log(`🗑️ Removed game ${gameId} from open games list: ${originalCount} -> ${newCount}`);
    }
  }

  /**
   * Force cleanup of the open games list
   * Useful for debugging and maintenance
   */
  async cleanupOpenGamesList(): Promise<void> {
    console.log('🧹 Starting forced cleanup of open games list...');

    const openGamesList = await this.kv.get<OpenGamesList>(KEYS.OPEN_GAMES);
    if (!openGamesList || !openGamesList.games) {
      console.log('✅ No open games list to clean up');
      return;
    }

    const now = Date.now();
    const validGames: GameState[] = [];

    for (const game of openGamesList.games) {
      // Fetch the current game state to verify status
      const currentGame = await this.getGame(game.gameId);

      if (currentGame &&
        currentGame.status === 'PENDING' &&
        !currentGame.player2 &&
        now - currentGame.createdAt < 300000) { // 5 minutes
        validGames.push(currentGame);
        console.log(`✅ Keeping valid game: ${game.gameId} (player: ${game.player1.name})`);
      } else {
        console.log(`🗑️ Removing stale/invalid game: ${game.gameId} (status: ${currentGame?.status || 'not found'}, has player2: ${currentGame ? !!currentGame.player2 : 'unknown'})`);
      }
    }

    if (validGames.length !== openGamesList.games.length) {
      await this.kv.put(KEYS.OPEN_GAMES, {
        games: validGames,
        lastUpdated: now
      });
      console.log(`✅ Cleanup complete: ${openGamesList.games.length} -> ${validGames.length} games`);
    } else {
      console.log('✅ No cleanup needed - all games are valid');
    }
  }
}
