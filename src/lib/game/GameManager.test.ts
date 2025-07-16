import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameManager, type GameManagerCallbacks } from './GameManager';
import type { GameState, GameHistory, PlayerStats } from '$lib/types/game';

vi.mock('$lib/websocket/client', () => ({
  GameWebSocketClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onGameUpdate: vi.fn(),
    onPlayerJoined: vi.fn()
  }))
}));

vi.mock('$lib/game/matching', () => ({
  GameMatchingService: vi.fn().mockImplementation(() => ({
    findOrCreateGame: vi.fn(),
    loadGameState: vi.fn()
  }))
}));

vi.mock('$lib/audio/Audio', () => ({
  gameAudio: {
    playMoveSound: vi.fn(),
    playGameTie: vi.fn(),
    playGameWon: vi.fn(),
    playGameLost: vi.fn()
  }
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.log to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('GameManager', () => {
  let gameManager: GameManager;
  let mockCallbacks: GameManagerCallbacks;
  let mockWebSocketClient: any;
  let mockMatchingService: any;
  let mockGameAudio: any;

  const testPlayerName = 'TestPlayer';
  const testPlayerId = 'player-123';
  const testGameId = 'game-456';

  const mockGameState: GameState = {
    gameId: testGameId,
    board: '_________',
    status: 'PENDING',
    player1: {
      id: testPlayerId,
      name: testPlayerName,
      symbol: 'X'
    },
    player2: undefined,
    lastPlayer: '',
    createdAt: Date.now(),
    lastMoveAt: Date.now()
  };

  const mockActiveGameState: GameState = {
    ...mockGameState,
    status: 'ACTIVE',
    player2: {
      id: 'player-789',
      name: 'TestPlayer2',
      symbol: 'O'
    }
  };

  const mockGameHistory: GameHistory = {
    player1: testPlayerName,
    player2: 'TestPlayer2',
    totalEncounters: 0,
    totalActive: 0,
    player1AsX: {totalWins: 0, totalLosses: 0, totalTies: 0, wins: { byResignation: 0, byTimeout: 0 }, losses: { byResignation: 0, byTimeout: 0 }},
    player1AsO: {totalWins: 0, totalLosses: 0, totalTies: 0, wins: { byResignation: 0, byTimeout: 0 }, losses: { byResignation: 0, byTimeout: 0 }},
    player2AsX: {totalWins: 0, totalLosses: 0, totalTies: 0, wins: { byResignation: 0, byTimeout: 0 }, losses: { byResignation: 0, byTimeout: 0 }},
    player2AsO: {totalWins: 0, totalLosses: 0, totalTies: 0, wins: { byResignation: 0, byTimeout: 0 }, losses: { byResignation: 0, byTimeout: 0 }},
  };

  beforeEach(async () => {
    // Suppress console logs during tests
    console.log = vi.fn();
    console.error = vi.fn();

    mockCallbacks = {
      onGameStateUpdated: vi.fn(),
      onGameHistoryUpdated: vi.fn(),
      onTurnChanged: vi.fn(),
      onPlayerIdUpdated: vi.fn(),
      onWebSocketStatusChanged: vi.fn()
    };

    vi.clearAllMocks();
    mockFetch.mockClear();

    // Get mock audio reference
    mockGameAudio = (await vi.importMock('$lib/audio/Audio')).gameAudio;

    // Create GameManager instance
    gameManager = new GameManager(mockCallbacks);

    // Get references to mocked instances
    mockWebSocketClient = gameManager.getWebSocketClient();
    mockMatchingService = (gameManager as any).gameMatchingService;
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    // Clean up
    gameManager.destroy();
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create GameManager with callbacks', () => {
      expect(gameManager).toBeDefined();
      expect(gameManager.getGameState()).toBeNull();
      expect(gameManager.getGameHistory()).toBeNull();
      expect(gameManager.getPlayerId()).toBe('');
      expect(gameManager.getPlayerName()).toBe('');
      expect(gameManager.getIsMyTurn()).toBe(false);
      expect(gameManager.getWebSocketNotificationsEnabled()).toBe(false);
    });

    test('should initialize with player name', () => {
      gameManager.initialize(testPlayerName);

      expect(gameManager.getPlayerName()).toBe(testPlayerName);
      expect(mockWebSocketClient.onGameUpdate).toHaveBeenCalled();
      expect(mockWebSocketClient.onPlayerJoined).toHaveBeenCalled();
    });
  });

  describe('Game Creation', () => {
    test('should create new game successfully', async () => {
      // Mock successful game creation
      mockMatchingService.findOrCreateGame.mockResolvedValue({
        success: true,
        gameId: testGameId,
        playerId: testPlayerId,
        playerSymbol: 'X',
        status: 'PENDING',
        webSocketNotificationsEnabled: true
      });

      mockMatchingService.loadGameState.mockResolvedValue(mockGameState);
      mockWebSocketClient.connect.mockResolvedValue(undefined);

      gameManager.initialize(testPlayerName);
      await gameManager.createNewGame();

      // Verify matching service was called
      expect(mockMatchingService.findOrCreateGame).toHaveBeenCalledWith(testPlayerName);
      expect(mockMatchingService.loadGameState).toHaveBeenCalledWith(testGameId);

      // Verify state was updated
      expect(gameManager.getGameState()).toEqual(mockGameState);
      expect(gameManager.getPlayerId()).toBe(testPlayerId);

      // Verify callbacks were called
      expect(mockCallbacks.onPlayerIdUpdated).toHaveBeenCalledWith(testPlayerId);
      expect(mockCallbacks.onGameStateUpdated).toHaveBeenCalledWith(mockGameState);
      expect(mockCallbacks.onWebSocketStatusChanged).toHaveBeenCalledWith(true);
      expect(mockCallbacks.onTurnChanged).toHaveBeenCalledWith(false); // PENDING game
    });

    test('should handle game creation failure', async () => {
      mockMatchingService.findOrCreateGame.mockResolvedValue({
        success: false,
        error: 'Failed to create game',
        gameId: '',
        playerId: '',
        playerSymbol: 'X',
        status: 'PENDING',
        webSocketNotificationsEnabled: false
      });

      gameManager.initialize(testPlayerName);

      await expect(gameManager.createNewGame()).rejects.toThrow('Failed to create game');

      expect(gameManager.getGameState()).toBeNull();
      expect(gameManager.getPlayerId()).toBe('');
    });

    test('should handle load game state failure', async () => {
      mockMatchingService.findOrCreateGame.mockResolvedValue({
        success: true,
        gameId: testGameId,
        playerId: testPlayerId,
        playerSymbol: 'X',
        status: 'PENDING',
        webSocketNotificationsEnabled: false
      });

      mockMatchingService.loadGameState.mockResolvedValue(null);

      gameManager.initialize(testPlayerName);

      await expect(gameManager.createNewGame()).rejects.toThrow('Failed to load game state');
    });

    test('should quit current game before creating new one', async () => {
      (gameManager as any).gameState = mockGameState;
      (gameManager as any).playerId = testPlayerId;

      // Mock quit game API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Mock new game creation
      mockMatchingService.findOrCreateGame.mockResolvedValue({
        success: true,
        gameId: 'new-game-id',
        playerId: 'new-player-id',
        playerSymbol: 'X',
        status: 'PENDING',
        webSocketNotificationsEnabled: false
      });

      mockMatchingService.loadGameState.mockResolvedValue({
        ...mockGameState,
        gameId: 'new-game-id'
      });

      gameManager.initialize(testPlayerName);
      await gameManager.createNewGame();

      // Verify quit API was called
      expect(mockFetch).toHaveBeenCalledWith(`/api/game/${testGameId}/quit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: testPlayerId, reason: 'RESIGN' })
      });
    });
  });

  describe('Making Moves', () => {
    beforeEach(async () => {
      // Setup active game state
      (gameManager as any).gameState = mockActiveGameState;
      (gameManager as any).playerId = testPlayerId;
      (gameManager as any).isMyTurn = true;
    });

    test('should make move successfully with optimistic update', async () => {
      const position = 0;
      const expectedBoard = 'X________';

      // Mock successful move API
      const moveResponse = {
        ...mockActiveGameState,
        board: expectedBoard,
        lastPlayer: 'X',
        lastMoveAt: Date.now()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(moveResponse)
      });

      await gameManager.makeMove(position);

      // Verify optimistic update happened first
      expect(mockCallbacks.onGameStateUpdated).toHaveBeenCalledTimes(2);

      // First call should have the optimistic update
      const firstCall = mockCallbacks.onGameStateUpdated.mock.calls[0][0];
      expect(firstCall.board).toBe(expectedBoard);

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith(`/api/game/${testGameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: testGameId,
          playerId: testPlayerId,
          cellPosition: position
        })
      });

      // Verify turn was disabled during move
      expect(mockCallbacks.onTurnChanged).toHaveBeenCalledWith(false);
    });

    test('should not make move when not my turn', async () => {
      (gameManager as any).isMyTurn = false;

      await gameManager.makeMove(0);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockCallbacks.onGameStateUpdated).not.toHaveBeenCalled();
    });

    test('should not make move when game is not active', async () => {
      (gameManager as any).gameState = mockGameState; // PENDING status

      await gameManager.makeMove(0);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockCallbacks.onGameStateUpdated).not.toHaveBeenCalled();
    });

    test('should not make move on occupied position', async () => {
      (gameManager as any).gameState = {
        ...mockActiveGameState,
        board: 'X________' // Position 0 already taken
      };

      await gameManager.makeMove(0);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockCallbacks.onGameStateUpdated).not.toHaveBeenCalled();
    });
  });

  describe('Game History', () => {
    test('should load game history when both players present', async () => {
      // Set up the game state with both players
      (gameManager as any).gameState = mockActiveGameState;

      // Create a proper mock response
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockGameHistory),
        statusText: 'OK'
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Clear previous calls
      mockCallbacks.onGameHistoryUpdated.mockClear();

      // Call the private method directly
      await (gameManager as any).loadGameHistory();

      // Debug: Check what was called
      console.log('fetch called:', mockFetch.mock.calls.length > 0);
      console.log('json() called:', mockResponse.json.mock.calls.length);
      console.log('onGameHistoryUpdated calls:', mockCallbacks.onGameHistoryUpdated.mock.calls);
      console.log('GameManager gameHistory after load:', gameManager.getGameHistory());

      expect(mockFetch).toHaveBeenCalledWith('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1: mockActiveGameState.player1!.name,
          player2: mockActiveGameState.player2!.name
        })
      });

      // Check if the response was processed correctly
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockCallbacks.onGameHistoryUpdated).toHaveBeenCalledWith(mockGameHistory);
    });

    test('should skip loading history when player2 is missing', async () => {
      (gameManager as any).gameState = mockGameState; // No player2

      await (gameManager as any).loadGameHistory();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockCallbacks.onGameHistoryUpdated).not.toHaveBeenCalled();
    });

    test('should handle history loading failure gracefully', async () => {
      (gameManager as any).gameState = mockActiveGameState;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not found'
      });

      await (gameManager as any).loadGameHistory();

      // Should not throw, just log warning
      expect(mockCallbacks.onGameHistoryUpdated).not.toHaveBeenCalled();
    });
  });

  describe('WebSocket Handling', () => {
    test('should handle game update from WebSocket', () => {
      (gameManager as any).gameState = mockGameState;
      (gameManager as any).playerId = testPlayerId;

      const updatedGameState = {
        ...mockActiveGameState,
        board: 'X_O______'
      };

      (gameManager as any).updateGameStateFromWebSocket(updatedGameState);

      expect(mockCallbacks.onGameStateUpdated).toHaveBeenCalledWith(updatedGameState);
      expect(gameManager.getGameState()).toEqual(updatedGameState);

      // Verify turn calculation
      expect(mockCallbacks.onTurnChanged).toHaveBeenCalled();
    });

    test('should handle player joined notification', async () => {
      (gameManager as any).gameState = mockGameState;
      (gameManager as any).playerId = testPlayerId; // Set as player1

      const playerJoinedData = {
        gameId: testGameId,
        player2: {
          id: 'player-789',
          name: 'TestPlayer2'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGameHistory)
      });

      await (gameManager as any).handlePlayerJoined(playerJoinedData);

      expect(gameManager.getGameState()?.status).toBe('ACTIVE');
      expect(gameManager.getGameState()?.player2).toEqual({
        id: 'player-789',
        name: 'TestPlayer2',
        symbol: 'O'
      });

      expect(mockCallbacks.onGameStateUpdated).toHaveBeenCalled();
      // Player1 (X) should go first when game becomes active
      expect(mockCallbacks.onTurnChanged).toHaveBeenCalledWith(true);
    });

    test('should calculate turn correctly for X player', () => {
      (gameManager as any).gameState = {
        ...mockActiveGameState,
        board: 'X_O______' // 2 moves made
      };
      (gameManager as any).playerId = testPlayerId; // Player1 (X)

      (gameManager as any).updateGameStateFromWebSocket((gameManager as any).gameState);

      // X should go on even move counts (0, 2, 4...)
      expect(mockCallbacks.onTurnChanged).toHaveBeenCalledWith(true);
    });

    test('should calculate turn correctly for O player', () => {
      (gameManager as any).gameState = {
        ...mockActiveGameState,
        board: 'X_O______' // 2 moves made
      };
      (gameManager as any).playerId = 'player-789'; // Player2 (O)

      (gameManager as any).updateGameStateFromWebSocket((gameManager as any).gameState);

      // O should go on odd move counts (1, 3, 5...)
      expect(mockCallbacks.onTurnChanged).toHaveBeenCalledWith(false);
    });
  });

  describe('Game Over Handling', () => {
    test('should play correct sound for win', () => {
      (gameManager as any).gameState = {
        ...mockActiveGameState,
        status: 'X_WIN'
      };
      (gameManager as any).playerId = testPlayerId; // Player1 (X)

      (gameManager as any).playGameOverSound();

      expect(mockGameAudio.playGameWon).toHaveBeenCalled();
    });

    test('should play correct sound for loss', () => {
      (gameManager as any).gameState = {
        ...mockActiveGameState,
        status: 'O_WIN'
      };
      (gameManager as any).playerId = testPlayerId; // Player1 (X)

      (gameManager as any).playGameOverSound();

      expect(mockGameAudio.playGameLost).toHaveBeenCalled();
    });

    test('should play correct sound for tie', () => {
      (gameManager as any).gameState = {
        ...mockActiveGameState,
        status: 'TIE'
      };

      (gameManager as any).playGameOverSound();

      expect(mockGameAudio.playGameTie).toHaveBeenCalled();
    });
  });

  describe('End Game', () => {

    test('should handle end game API failure', async () => {
      (gameManager as any).gameState = mockActiveGameState;
      (gameManager as any).playerId = testPlayerId;

      // Create a proper mock Response object that simulates failure
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({}),
        text: vi.fn().mockResolvedValue('Cannot end game')
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      // The endGame method should throw an error
      await expect(gameManager.endGame('TIMEOUT')).rejects.toThrow('Failed to end game: Cannot end game');

      // Verify that text() was called on the failed response
      expect(mockResponse.text).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Destroy', () => {
    test('should disconnect WebSocket on destroy', () => {
      (gameManager as any).webSocketNotificationsEnabled = true;

      gameManager.destroy();

      expect(mockWebSocketClient.disconnect).toHaveBeenCalled();
      expect(gameManager.getWebSocketNotificationsEnabled()).toBe(false);
    });

    test('should clear game state properly', () => {
      (gameManager as any).gameState = mockActiveGameState;
      (gameManager as any).playerId = testPlayerId;
      (gameManager as any).isMyTurn = true;

      (gameManager as any).clearGameState();

      expect(gameManager.getGameState()).toBeNull();
      expect(gameManager.getPlayerId()).toBe('');
      expect(gameManager.getIsMyTurn()).toBe(false);

      expect(mockCallbacks.onGameStateUpdated).toHaveBeenCalledWith(null);
      expect(mockCallbacks.onTurnChanged).toHaveBeenCalledWith(false);
      expect(mockCallbacks.onPlayerIdUpdated).toHaveBeenCalledWith('');
    });
  });

  describe('Utility Methods', () => {
    test('getMySymbol should return correct symbol for player1', () => {
      (gameManager as any).gameState = mockActiveGameState;
      (gameManager as any).playerId = testPlayerId;

      const symbol = (gameManager as any).getMySymbol();
      expect(symbol).toBe('X');
    });

    test('getMySymbol should return correct symbol for player2', () => {
      (gameManager as any).gameState = mockActiveGameState;
      (gameManager as any).playerId = 'player-789';

      const symbol = (gameManager as any).getMySymbol();
      expect(symbol).toBe('O');
    });

    test('should handle missing WebSocket client gracefully', () => {
      (gameManager as any).wsClient = null;

      expect(() => {
        (gameManager as any).setupWebSocketCallbacks();
        (gameManager as any).connectWebSocketForActiveGame();
        gameManager.destroy();
      }).not.toThrow();
    });
  });
});
