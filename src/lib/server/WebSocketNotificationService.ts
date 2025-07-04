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
    durableObjectOrLocalUrl: DurableObjectNamespace | string
  ): Promise<void> {
    const message: GameMessage = {
      type: 'gameUpdate',
      gameId,
      data: createGameUpdateData(gameState),
      timestamp: Date.now()
    };

    try {
      if (typeof durableObjectOrLocalUrl === 'string') {
        // Local development - send to local WebSocket worker
        await this.sendToLocalWebSocketWorker(durableObjectOrLocalUrl, gameId, message);
      } else {
        // Production - use Durable Object
        await this.sendToDurableObject(durableObjectOrLocalUrl, gameId, message);
      }
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
    durableObjectOrLocalUrl: DurableObjectNamespace | string
  ): Promise<void> {
    const message: GameMessage = {
      type: 'playerJoined',
      gameId,
      data: createPlayerJoinedData(gameState),
      timestamp: Date.now()
    };

    try {
      if (typeof durableObjectOrLocalUrl === 'string') {
        // Local development - send to local WebSocket worker
        console.log('🔌 Sending playerJoined notification to local WebSocket worker:', durableObjectOrLocalUrl);
        await this.sendToLocalWebSocketWorker(durableObjectOrLocalUrl, gameId, message);
        console.log('✅ Local WebSocket notification sent successfully');
      } else {
        // Production - use Durable Object
        await this.sendToDurableObject(durableObjectOrLocalUrl, gameId, message);
      }
    } catch (error) {
      console.error('Failed to notify player joined:', error);
      throw error;
    }
  }

  /**
   * Send notification to local WebSocket worker
   */
  private static async sendToLocalWebSocketWorker(
    localUrl: string,
    gameId: string,
    message: GameMessage
  ): Promise<void> {
    console.log('📡 Making HTTP request to local WebSocket worker:', `${localUrl}/notify`);
    console.log('📦 Message payload:', JSON.stringify({ gameId, message }, null, 2));

    const response = await fetch(`${localUrl}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, message })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Local WebSocket worker notification failed:', response.status, response.statusText, errorText);
      throw new Error(`Local WebSocket worker notification failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('📨 Raw response text:', responseText);

    try {
      const responseData = JSON.parse(responseText);
      console.log('✅ Local WebSocket worker response:', responseData);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', responseText);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  }

  /**
   * Send notification to production Durable Object
   */
  private static async sendToDurableObject(
    durableObject: DurableObjectNamespace,
    gameId: string,
    message: GameMessage
  ): Promise<void> {
    const id = durableObject.idFromName(`game-${gameId}`);
    const stub = durableObject.get(id);

    await stub.fetch('http://internal/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, message })
    });
  }
}