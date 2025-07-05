import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameStorage } from './games';
import type { GameState } from '../types/game';

// Mock KVStorage
const mockKVStorage = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

describe('GameStorage - Open Games List Management', () => {
  let gameStorage: GameStorage;

  beforeEach(() => {
    gameStorage = new GameStorage(mockKVStorage as any);
    mockKVStorage.get.mockClear();
    mockKVStorage.put.mockClear();
    mockKVStorage.delete.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getOpenGames with cleanup', () => {
    test('should filter out completed games from open games list', async () => {
      const now = Date.now();

      // Mock open games list with mixed statuses
      const openGamesList = {
        games: [
          {
            gameId: 'pending-game',
            status: 'PENDING',
            createdAt: now - 60000, // 1 minute ago
            player1: { id: 'p1', name: 'Player1', symbol: 'X' }
          },
          {
            gameId: 'completed-game',
            status: 'X_WIN',
            createdAt: now - 120000, // 2 minutes ago
            player1: { id: 'p2', name: 'Player2', symbol: 'X' }
          },
          {
            gameId: 'stale-game',
            status: 'PENDING',
            createdAt: now - 400000, // 6+ minutes ago (stale)
            player1: { id: 'p3', name: 'Player3', symbol: 'X' }
          }
        ],
        lastUpdated: now - 60000
      };

      // Mock the KV get calls
      mockKVStorage.get
        .mockResolvedValueOnce(openGamesList) // First call for open games list
        .mockResolvedValueOnce({ // pending-game lookup
          gameId: 'pending-game',
          status: 'PENDING',
          createdAt: now - 60000,
          player1: { id: 'p1', name: 'Player1', symbol: 'X' }
        })
        .mockResolvedValueOnce({ // completed-game lookup
          gameId: 'completed-game',
          status: 'X_WIN',
          createdAt: now - 120000,
          player1: { id: 'p2', name: 'Player2', symbol: 'X' }
        })
        .mockResolvedValueOnce({ // stale-game lookup
          gameId: 'stale-game',
          status: 'PENDING',
          createdAt: now - 400000,
          player1: { id: 'p3', name: 'Player3', symbol: 'X' }
        });

      const result = await gameStorage.getOpenGames();

      // Should only return the valid pending game
      expect(result).toHaveLength(1);
      expect(result[0].gameId).toBe('pending-game');
      expect(result[0].status).toBe('PENDING');

      // Should update the open games list to remove invalid games
      expect(mockKVStorage.put).toHaveBeenCalledWith(
        'games:open',
        expect.objectContaining({
          games: expect.arrayContaining([
            expect.objectContaining({ gameId: 'pending-game' })
          ]),
          lastUpdated: expect.any(Number)
        })
      );
    });

    test('should handle empty open games list', async () => {
      mockKVStorage.get.mockResolvedValueOnce(null);

      const result = await gameStorage.getOpenGames();

      expect(result).toEqual([]);
      expect(mockKVStorage.put).not.toHaveBeenCalled();
    });

    test('should handle games that no longer exist in KV', async () => {
      const now = Date.now();
      const openGamesList = {
        games: [
          {
            gameId: 'missing-game',
            status: 'PENDING',
            createdAt: now - 60000,
            player1: { id: 'p1', name: 'Player1', symbol: 'X' }
          }
        ],
        lastUpdated: now - 60000
      };

      mockKVStorage.get
        .mockResolvedValueOnce(openGamesList) // open games list
        .mockResolvedValueOnce(null); // missing game lookup

      const result = await gameStorage.getOpenGames();

      expect(result).toEqual([]);
      expect(mockKVStorage.put).toHaveBeenCalledWith(
        'games:open',
        expect.objectContaining({
          games: [],
          lastUpdated: expect.any(Number)
        })
      );
    });
  });

  describe('saveGame updates open games list correctly', () => {
    test('should remove completed game from open games list', async () => {
      const completedGame: GameState = {
        gameId: 'test-game',
        status: 'X_WIN',
        board: '_________',
        createdAt: Date.now(),
        lastMoveAt: Date.now(),
        lastPlayer: 'X',
        player1: { id: 'p1', name: 'Player1', symbol: 'X' },
        player2: { id: 'p2', name: 'Player2', symbol: 'O' }
      };

      const existingOpenGamesList = {
        games: [
          {
            gameId: 'test-game',
            status: 'PENDING',
            createdAt: Date.now(),
            player1: { id: 'p1', name: 'Player1', symbol: 'X' }
          },
          {
            gameId: 'other-game',
            status: 'PENDING',
            createdAt: Date.now(),
            player1: { id: 'p3', name: 'Player3', symbol: 'X' }
          }
        ],
        lastUpdated: Date.now()
      };

      mockKVStorage.get.mockResolvedValueOnce(existingOpenGamesList);

      await gameStorage.saveGame(completedGame);

      // Should save the game
      expect(mockKVStorage.put).toHaveBeenCalledWith('game:test-game', completedGame);

      // Should save player mappings
      expect(mockKVStorage.put).toHaveBeenCalledWith('player:p1:game', 'test-game', 3600);
      expect(mockKVStorage.put).toHaveBeenCalledWith('player:p2:game', 'test-game', 3600);

      // Should update open games list to remove the completed game
      expect(mockKVStorage.put).toHaveBeenCalledWith(
        'games:open',
        expect.objectContaining({
          games: expect.arrayContaining([
            expect.objectContaining({ gameId: 'other-game' })
          ]),
          lastUpdated: expect.any(Number)
        })
      );

      // Verify the completed game was removed from open games list
      const openGamesCall = mockKVStorage.put.mock.calls.find(
        call => call[0] === 'games:open'
      );
      expect(openGamesCall[1].games).toHaveLength(1);
      expect(openGamesCall[1].games[0].gameId).toBe('other-game');
    });

    test('should add pending game to open games list', async () => {
      const pendingGame: GameState = {
        gameId: 'new-pending-game',
        status: 'PENDING',
        board: '_________',
        createdAt: Date.now(),
        lastMoveAt: Date.now(),
        lastPlayer: '',
        player1: { id: 'p1', name: 'Player1', symbol: 'X' }
      };

      const existingOpenGamesList = {
        games: [
          {
            gameId: 'other-game',
            status: 'PENDING',
            createdAt: Date.now(),
            player1: { id: 'p3', name: 'Player3', symbol: 'X' }
          }
        ],
        lastUpdated: Date.now()
      };

      mockKVStorage.get.mockResolvedValueOnce(existingOpenGamesList);

      await gameStorage.saveGame(pendingGame);

      // Should update open games list to include the new pending game
      expect(mockKVStorage.put).toHaveBeenCalledWith(
        'games:open',
        expect.objectContaining({
          games: expect.arrayContaining([
            expect.objectContaining({ gameId: 'other-game' }),
            expect.objectContaining({ gameId: 'new-pending-game' })
          ]),
          lastUpdated: expect.any(Number)
        })
      );
    });

    test('should update existing pending game in open games list', async () => {
      const updatedGame: GameState = {
        gameId: 'existing-game',
        status: 'ACTIVE',
        board: 'X________',
        createdAt: Date.now() - 120000,
        lastMoveAt: Date.now(),
        lastPlayer: 'X',
        player1: { id: 'p1', name: 'Player1', symbol: 'X' },
        player2: { id: 'p2', name: 'Player2', symbol: 'O' }
      };

      const existingOpenGamesList = {
        games: [
          {
            gameId: 'existing-game',
            status: 'PENDING',
            createdAt: Date.now() - 120000,
            player1: { id: 'p1', name: 'Player1', symbol: 'X' }
          },
          {
            gameId: 'other-game',
            status: 'PENDING',
            createdAt: Date.now(),
            player1: { id: 'p3', name: 'Player3', symbol: 'X' }
          }
        ],
        lastUpdated: Date.now()
      };

      mockKVStorage.get.mockResolvedValueOnce(existingOpenGamesList);

      await gameStorage.saveGame(updatedGame);

      // Should remove the now-active game from open games list
      const openGamesCall = mockKVStorage.put.mock.calls.find(
        call => call[0] === 'games:open'
      );
      expect(openGamesCall[1].games).toHaveLength(1);
      expect(openGamesCall[1].games[0].gameId).toBe('other-game');
    });
  });

  describe('deleteGame', () => {
    test('should delete game and remove from open games list', async () => {
      const gameToDelete: GameState = {
        gameId: 'delete-me',
        status: 'PENDING',
        board: '_________',
        createdAt: Date.now(),
        lastMoveAt: Date.now(),
        lastPlayer: '',
        player1: { id: 'p1', name: 'Player1', symbol: 'X' }
      };

      const existingOpenGamesList = {
        games: [
          {
            gameId: 'delete-me',
            status: 'PENDING',
            createdAt: Date.now(),
            player1: { id: 'p1', name: 'Player1', symbol: 'X' }
          },
          {
            gameId: 'keep-me',
            status: 'PENDING',
            createdAt: Date.now(),
            player1: { id: 'p3', name: 'Player3', symbol: 'X' }
          }
        ],
        lastUpdated: Date.now()
      };

      mockKVStorage.get
        .mockResolvedValueOnce(gameToDelete) // getGame call
        .mockResolvedValueOnce(existingOpenGamesList); // removeFromOpenGamesList call

      await gameStorage.deleteGame('delete-me');

      // Should delete the game
      expect(mockKVStorage.delete).toHaveBeenCalledWith('game:delete-me');

      // Should delete player mappings
      expect(mockKVStorage.delete).toHaveBeenCalledWith('player:p1:game');

      // Should update open games list to remove the deleted game
      expect(mockKVStorage.put).toHaveBeenCalledWith(
        'games:open',
        expect.objectContaining({
          games: expect.arrayContaining([
            expect.objectContaining({ gameId: 'keep-me' })
          ]),
          lastUpdated: expect.any(Number)
        })
      );
    });

    test('should handle deleting non-existent game gracefully', async () => {
      mockKVStorage.get.mockResolvedValueOnce(null);

      await gameStorage.deleteGame('non-existent');

      // Should not attempt any deletions
      expect(mockKVStorage.delete).not.toHaveBeenCalled();
      expect(mockKVStorage.put).not.toHaveBeenCalled();
    });
  });

  describe('findPlayerGame', () => {
    test('should return game ID for player', async () => {
      mockKVStorage.get.mockResolvedValueOnce('game-123');

      const result = await gameStorage.findPlayerGame('player-1');

      expect(result).toBe('game-123');
      expect(mockKVStorage.get).toHaveBeenCalledWith('player:player-1:game');
    });

    test('should return null if player has no game', async () => {
      mockKVStorage.get.mockResolvedValueOnce(null);

      const result = await gameStorage.findPlayerGame('player-1');

      expect(result).toBeNull();
    });
  });

  describe('cleanupOpenGamesList', () => {
    test('should remove stale and completed games', async () => {
      const now = Date.now();
      const openGamesList = {
        games: [
          {
            gameId: 'valid-game',
            status: 'PENDING',
            createdAt: now - 60000,
            player1: { id: 'p1', name: 'Player1', symbol: 'X' }
          },
          {
            gameId: 'completed-game',
            status: 'PENDING', // Listed as pending but actually completed
            createdAt: now - 120000,
            player1: { id: 'p2', name: 'Player2', symbol: 'X' }
          },
          {
            gameId: 'stale-game',
            status: 'PENDING',
            createdAt: now - 400000, // Too old
            player1: { id: 'p3', name: 'Player3', symbol: 'X' }
          }
        ],
        lastUpdated: now - 60000
      };

      mockKVStorage.get
        .mockResolvedValueOnce(openGamesList) // Initial open games list
        .mockResolvedValueOnce({ // valid-game lookup
          gameId: 'valid-game',
          status: 'PENDING',
          createdAt: now - 60000,
          player1: { id: 'p1', name: 'Player1', symbol: 'X' }
        })
        .mockResolvedValueOnce({ // completed-game lookup
          gameId: 'completed-game',
          status: 'X_WIN', // Actually completed
          createdAt: now - 120000,
          player1: { id: 'p2', name: 'Player2', symbol: 'X' }
        })
        .mockResolvedValueOnce({ // stale-game lookup
          gameId: 'stale-game',
          status: 'PENDING',
          createdAt: now - 400000, // Too old
          player1: { id: 'p3', name: 'Player3', symbol: 'X' }
        });

      await gameStorage.cleanupOpenGamesList();

      // Should update list to only contain valid game
      expect(mockKVStorage.put).toHaveBeenCalledWith(
        'games:open',
        expect.objectContaining({
          games: [
            expect.objectContaining({ gameId: 'valid-game' })
          ],
          lastUpdated: expect.any(Number)
        })
      );
    });

    test('should handle empty open games list', async () => {
      mockKVStorage.get.mockResolvedValueOnce(null);

      await gameStorage.cleanupOpenGamesList();

      // Should not attempt to update anything
      expect(mockKVStorage.put).not.toHaveBeenCalled();
    });

    test('should not update list if no cleanup needed', async () => {
      const now = Date.now();
      const openGamesList = {
        games: [
          {
            gameId: 'valid-game',
            status: 'PENDING',
            createdAt: now - 60000,
            player1: { id: 'p1', name: 'Player1', symbol: 'X' }
          }
        ],
        lastUpdated: now - 60000
      };

      mockKVStorage.get
        .mockResolvedValueOnce(openGamesList) // Initial open games list
        .mockResolvedValueOnce({ // valid-game lookup
          gameId: 'valid-game',
          status: 'PENDING',
          createdAt: now - 60000,
          player1: { id: 'p1', name: 'Player1', symbol: 'X' }
        });

      await gameStorage.cleanupOpenGamesList();

      // Should not update the list since no cleanup was needed
      expect(mockKVStorage.put).not.toHaveBeenCalled();
    });
  });

  describe('getGame', () => {
    test('should retrieve game by ID', async () => {
      const mockGame: GameState = {
        gameId: 'test-game',
        status: 'ACTIVE',
        board: 'X_O______',
        createdAt: Date.now(),
        lastMoveAt: Date.now(),
        lastPlayer: 'X',
        player1: { id: 'p1', name: 'Player1', symbol: 'X' },
        player2: { id: 'p2', name: 'Player2', symbol: 'O' }
      };

      mockKVStorage.get.mockResolvedValueOnce(mockGame);

      const result = await gameStorage.getGame('test-game');

      expect(result).toEqual(mockGame);
      expect(mockKVStorage.get).toHaveBeenCalledWith('game:test-game');
    });

    test('should return null for non-existent game', async () => {
      mockKVStorage.get.mockResolvedValueOnce(null);

      const result = await gameStorage.getGame('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    test('should handle KV storage errors gracefully', async () => {
      const error = new Error('KV storage error');
      mockKVStorage.get.mockRejectedValueOnce(error);

      await expect(gameStorage.getGame('test-game')).rejects.toThrow('KV storage error');
    });

    test('should handle errors in updateOpenGamesList', async () => {
      const pendingGame: GameState = {
        gameId: 'test-game',
        status: 'PENDING',
        board: '_________',
        createdAt: Date.now(),
        lastMoveAt: Date.now(),
        lastPlayer: '',
        player1: { id: 'p1', name: 'Player1', symbol: 'X' }
      };

      const error = new Error('Update failed');
      mockKVStorage.get.mockRejectedValueOnce(error);

      await expect(gameStorage.saveGame(pendingGame)).rejects.toThrow();
    });
  });
});
