import type { GameState } from '../types/game.js';
import type { GameMessage } from '../types/websocket.js';
import { createGameUpdateData, createPlayerJoinedData } from './GameStateSerializer.js';

export class WebSocketNotificationService {
  
  /**
   * Send a game update notification to all players in a game
   */
  static async notifyGameUpdate(
    gameId: string,
    gameState: GameState,
    durableObject: DurableObjectNamespace
  ): Promise<void> {
    const id = durableObject.idFromName(`game-${gameId}`);
    const stub = durableObject.get(id);

    const message: GameMessage = {
      type: 'gameUpdate',
      gameId,
      data: createGameUpdateData(gameState),
      timestamp: Date.now()
    };

    try {
      await stub.fetch('http://internal/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, message })
      });
    } catch (error) {
      console.error('Failed to notify game update:', error);
      throw error;
    }
  }

  /**
   * Send a player joined notification to all players in a game
   */
  static async notifyPlayerJoined(
    gameId: string,
    gameState: GameState,
    durableObject: DurableObjectNamespace
  ): Promise<void> {
    const id = durableObject.idFromName(`game-${gameId}`);
    const stub = durableObject.get(id);

    const message: GameMessage = {
      type: 'playerJoined',
      gameId,
      data: createPlayerJoinedData(gameState),
      timestamp: Date.now()
    };

    try {
      await stub.fetch('http://internal/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, message })
      });
    } catch (error) {
      console.error('Failed to notify player joined:', error);
      throw error;
    }
  }
}
