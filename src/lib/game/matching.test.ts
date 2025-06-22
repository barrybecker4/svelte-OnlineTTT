import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameMatchingService } from './matching';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GameMatchingService', () => {
  let service: GameMatchingService;

  beforeEach(() => {
    service = new GameMatchingService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findOrCreateGame', () => {
    test('should return error for empty player name', async () => {
      const result = await service.findOrCreateGame('');
      
      expect(result).toEqual({
        success: false,
        gameId: '',
        playerId: '',
        playerSymbol: 'X',
        status: 'PENDING',
        error: 'Player name is required'
      });
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should return error for whitespace-only player name', async () => {
      const result = await service.findOrCreateGame('   ');
      
      expect(result).toEqual({
        success: false,
        gameId: '',
        playerId: '',
        playerSymbol: 'X',
        status: 'PENDING',
        error: 'Player name is required'
      });
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should successfully create new game for valid player', async () => {
      const mockResponse = {
        gameId: 'test-game-123',
        playerId: 'player-456',
        playerSymbol: 'X',
        status: 'PENDING',
        webSocketNotificationsEnabled: true,
        player1: 'TestPlayer',
        player2: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.findOrCreateGame('TestPlayer');

      expect(mockFetch).toHaveBeenCalledWith('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: 'TestPlayer' })
      });

      expect(result).toEqual({
        success: true,
        gameId: 'test-game-123',
        playerId: 'player-456',
        playerSymbol: 'X',
        status: 'PENDING'
      });
    });

    test('should successfully join existing game', async () => {
      const mockResponse = {
        gameId: 'existing-game-789',
        playerId: 'player-101',
        playerSymbol: 'O',
        status: 'ACTIVE',
        webSocketNotificationsEnabled: false,
        player1: 'FirstPlayer',
        player2: 'SecondPlayer'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.findOrCreateGame('SecondPlayer');

      expect(result).toEqual({
        success: true,
        gameId: 'existing-game-789',
        playerId: 'player-101',
        playerSymbol: 'O',
        status: 'ACTIVE'
      });
    });

    test('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Server error message')
      });

      const result = await service.findOrCreateGame('TestPlayer');

      expect(result).toEqual({
        success: false,
        gameId: '',
        playerId: '',
        playerSymbol: 'X',
        status: 'PENDING',
        error: 'Failed to create/join game: Server error message'
      });
    });

    test('should handle invalid server response', async () => {
      const invalidResponse = {
        // Missing required fields
        someOtherField: 'value'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse)
      });

      const result = await service.findOrCreateGame('TestPlayer');

      expect(result).toEqual({
        success: false,
        gameId: '',
        playerId: '',
        playerSymbol: 'X',
        status: 'PENDING',
        error: 'Invalid response from server'
      });
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.findOrCreateGame('TestPlayer');

      expect(result).toEqual({
        success: false,
        gameId: '',
        playerId: '',
        playerSymbol: 'X',
        status: 'PENDING',
        error: 'Network error'
      });
    });

    test('should trim whitespace from player name', async () => {
      const mockResponse = {
        gameId: 'test-game-123',
        playerId: 'player-456',
        playerSymbol: 'X',
        status: 'PENDING',
        webSocketNotificationsEnabled: true,
        player1: 'TestPlayer',
        player2: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.findOrCreateGame('  TestPlayer  ');

      expect(mockFetch).toHaveBeenCalledWith('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: 'TestPlayer' })
      });
    });
  });

  describe('loadGameState', () => {
    test('should return null for empty gameId', async () => {
      const result = await service.loadGameState('');
      
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should successfully load game state', async () => {
      const mockApiResponse = {
        gameId: 'test-game-123',
        board: '_________',
        status: 'ACTIVE',
        player1: 'Player1',
        player1Id: 'p1-id',
        player2: 'Player2',
        player2Id: 'p2-id',
        nextPlayer: 'X',
        lastPlayer: '',
        lastMoveAt: 1234567890
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const result = await service.loadGameState('test-game-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/game/test-game-123');

      expect(result).toEqual({
        gameId: 'test-game-123',
        board: '_________',
        status: 'ACTIVE',
        player1: {
          id: 'p1-id',
          symbol: 'X',
          name: 'Player1'
        },
        player2: {
          id: 'p2-id',
          symbol: 'O',
          name: 'Player2'
        },
        lastPlayer: '',
        createdAt: expect.any(Number),
        lastMoveAt: 1234567890
      });
    });

    test('should handle game with only player1', async () => {
      const mockApiResponse = {
        gameId: 'pending-game-456',
        board: '_________',
        status: 'PENDING',
        player1: 'Player1',
        player1Id: 'p1-id',
        player2: null,
        player2Id: null,
        nextPlayer: null,
        lastPlayer: '',
        lastMoveAt: 1234567890
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const result = await service.loadGameState('pending-game-456');

      expect(result).toEqual({
        gameId: 'pending-game-456',
        board: '_________',
        status: 'PENDING',
        player1: {
          id: 'p1-id',
          symbol: 'X',
          name: 'Player1'
        },
        player2: undefined,
        lastPlayer: '',
        createdAt: expect.any(Number),
        lastMoveAt: 1234567890
      });
    });

    test('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await service.loadGameState('nonexistent-game');

      expect(result).toBeNull();
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.loadGameState('test-game-123');

      expect(result).toBeNull();
    });
  });

  describe('constructor with custom baseUrl', () => {
    test('should use custom baseUrl for API calls', async () => {
      const customService = new GameMatchingService('https://custom-api.com');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          gameId: 'test',
          playerId: 'test',
          playerSymbol: 'X',
          status: 'PENDING'
        })
      });

      await customService.findOrCreateGame('TestPlayer');

      expect(mockFetch).toHaveBeenCalledWith('https://custom-api.com/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: 'TestPlayer' })
      });
    });
  });
});