import type { GameState } from '$lib/types/game';
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
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Find an available game or create a new one for the player
   * This encapsulates all the matching logic in one place
   */
  async findOrCreateGame(playerName: string): Promise<GameJoinResult> {
    if (!playerName?.trim()) {
      return {
        success: false,
        gameId: '',
        playerId: '',
        playerSymbol: 'X',
        status: 'PENDING',
        webSocketNotificationsEnabled: false,
        error: 'Player name is required'
      };
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
        return {
          success: false,
          gameId: '',
          playerId: '',
          playerSymbol: 'X',
          status: 'PENDING',
          webSocketNotificationsEnabled: false,
          error: `Failed to create/join game: ${errorText}`
        };
      }

      const data = await response.json() as GameCreationResponse;

      // Validate the response has required fields
      if (!data.gameId || !data.playerId || !data.playerSymbol) {
        return {
          success: false,
          gameId: '',
          playerId: '',
          playerSymbol: 'X',
          status: 'PENDING',
          webSocketNotificationsEnabled: false,
          error: 'Invalid response from server'
        };
      }

      console.log('✅ Game join successful:', {
        gameId: data.gameId,
        playerId: data.playerId,
        symbol: data.playerSymbol,
        status: data.status,
        webSocketNotificationsEnabled: data.webSocketNotificationsEnabled
      });

      return {
        success: true,
        gameId: data.gameId,
        playerId: data.playerId,
        playerSymbol: data.playerSymbol,
        status: data.status as 'PENDING' | 'ACTIVE',
        webSocketNotificationsEnabled: data.webSocketNotificationsEnabled
      };

    } catch (error) {
      console.error('❌ Error in game matching:', error);
      return {
        success: false,
        gameId: '',
        playerId: '',
        playerSymbol: 'X',
        status: 'PENDING',
        webSocketNotificationsEnabled: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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

      const data = await response.json() as GameStateResponse;
      
      // Convert API response to GameState
      const gameState: GameState = {
        gameId: data.gameId,
        board: data.board,
        status: data.status as any,
        player1: {
          id: data.player1Id,
          symbol: 'X',
          name: data.player1
        },
        player2: data.player2 && data.player2Id ? {
          id: data.player2Id,
          symbol: 'O',
          name: data.player2
        } : undefined,
        lastPlayer: data.lastPlayer as any,
        createdAt: Date.now(), // API doesn't return this currently
        lastMoveAt: data.lastMoveAt
      };

      console.log('✅ Game state loaded successfully');
      return gameState;

    } catch (error) {
      console.error('❌ Error loading game state:', error);
      return null;
    }
  }
}