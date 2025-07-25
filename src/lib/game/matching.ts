import type { GameState, GameStatus, PlayerSymbol } from '$lib/types/game';
import type { GameStateResponse, GameCreationResponse } from '$lib/types/api';

interface GameJoinResult {
  success: boolean;
  gameId: string;
  playerId: string;
  playerSymbol: 'X' | 'O';
  status: 'PENDING' | 'ACTIVE';
  webSocketNotificationsEnabled?: boolean;
  error?: string;
}

/**
 * Game matching service that handles the core logic of finding or creating games for players.
 */
export class GameMatchingService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Find an available game or create a new one for the player
   * This encapsulates the matching logic in one place
   */
  async findOrCreateGame(playerName: string): Promise<GameJoinResult> {
    if (!playerName?.trim()) {
      return this.createFailedResult('Player name is required');
    }

    try {
      console.log('🎯 Finding or creating game for player:', playerName);
      const response = await fetch(`${this.baseUrl}/api/game/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return this.createFailedResult(`Failed to create/join game: ${errorText}`);
      }

      const data = await response.json() as GameCreationResponse;

      if (!data.gameId || !data.playerId || !data.playerSymbol) {
        return this.createFailedResult('Invalid response from server');
      }

      return {
        success: true,
        gameId: data.gameId,
        playerId: data.playerId,
        playerSymbol: data.playerSymbol,
        status: data.status as 'PENDING' | 'ACTIVE',
        webSocketNotificationsEnabled: data.webSocketNotificationsEnabled
      };

    } catch (error) {
      return this.createFailedResult(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private createFailedResult(message: string): GameJoinResult {
    return {
      success: false,
      gameId: '',
      playerId: '',
      playerSymbol: 'X',
      status: 'PENDING',
      webSocketNotificationsEnabled: false,
      error: message,
    };
  }

  /**
   * Load the current state of a specific game
   */
  async loadGameState(gameId: string): Promise<GameState | null> {
    if (!gameId) {
      console.error('Cannot load game state without gameId');
      return null;
    }

    try {
      console.log('📊 Loading game state for:', gameId);

      const response = await fetch(`${this.baseUrl}/api/game/${gameId}`);

      if (!response.ok) {
        console.error(`Failed to load game: ${response.status} ${response.statusText}`);
        return null;
      }

      const responseData = await response.json() as GameStateResponse;
      return this.gameStateFromResponse(responseData);

    } catch (error) {
      console.error('❌ Error loading game state:', error);
      return null;
    }
  }

  gameStateFromResponse(response: GameStateResponse): GameState | null {
    const gameState: GameState = {
      gameId: response.gameId,
      board: response.board,
      status: response.status as GameStatus,
      player1: {
        id: response.player1Id,
        symbol: 'X',
        name: response.player1
      },
      player2: response.player2 && response.player2Id ? {
        id: response.player2Id,
        symbol: 'O',
        name: response.player2
      } : undefined,
      lastPlayer: response.lastPlayer as PlayerSymbol | '',
      createdAt: Date.now(), // API doesn't return this currently
      lastMoveAt: response.lastMoveAt
    };

    console.log('✅ Game state loaded successfully');
    return gameState;
  }
}
