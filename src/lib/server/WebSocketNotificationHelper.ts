import type { GameState } from '../types/game.js';

export class WebSocketNotificationHelper {

  /**
   * Send a player joined notification - SIMPLIFIED
   */
  static async sendPlayerJoined(gameState: GameState, platform: App.Platform): Promise<void> {
    console.log(`🔔 Sending playerJoined notification for game ${gameState.gameId}`);

    const message = {
      type: 'playerJoined',
      gameId: gameState.gameId,
      data: {
        gameId: gameState.gameId,
        status: gameState.status,
        player1: {
          id: gameState.player1.id,
          name: gameState.player1.name,
          symbol: 'X'
        },
        player2: gameState.player2 ? {
          id: gameState.player2.id,
          name: gameState.player2.name,
          symbol: 'O'
        } : null,
        nextPlayer: 'X', // Game just started, X goes first
        board: gameState.board,
        lastPlayer: gameState.lastPlayer,
        lastMoveAt: gameState.lastMoveAt
      },
      timestamp: Date.now()
    };

    await this.sendNotification(gameState.gameId, message, platform);
  }

  /**
   * Send a game update notification - SIMPLIFIED
   */
  static async sendGameUpdate(gameState: GameState, platform: App.Platform): Promise<void> {
    console.log(`🔔 Sending gameUpdate notification for game ${gameState.gameId}`);

    const nextPlayer = gameState.lastPlayer === '' ? 'X' :
      gameState.lastPlayer === 'X' ? 'O' : 'X';

    const message = {
      type: 'gameUpdate',
      gameId: gameState.gameId,
      data: {
        gameId: gameState.gameId,
        status: gameState.status,
        player1: {
          id: gameState.player1.id,
          name: gameState.player1.name,
          symbol: 'X'
        },
        player2: gameState.player2 ? {
          id: gameState.player2.id,
          name: gameState.player2.name,
          symbol: 'O'
        } : null,
        nextPlayer,
        board: gameState.board,
        lastPlayer: gameState.lastPlayer,
        lastMoveAt: gameState.lastMoveAt
      },
      timestamp: Date.now()
    };

    await this.sendNotification(gameState.gameId, message, platform);
  }

  /**
   * Simple HTTP POST to WebSocket worker with retry and fallback
   */
  private static async sendNotification(gameId: string, message: any, platform: App.Platform): Promise<void> {
    const isLocalDevelopment = !platform?.env?.WEBSOCKET_HIBERNATION_SERVER;

    if (!isLocalDevelopment) {
      // Production: Use deployed worker
      try {
        const workerUrl = 'https://svelte-ttt-websocket.barrybecker4.workers.dev'; // Update with your worker URL
        await this.sendToWorker(workerUrl, gameId, message);
        return;
      } catch (error) {
        console.error(`❌ Failed to send to production worker:`, error);
        return; // Don't continue to local fallback in production
      }
    }

    // Local development: Try multiple approaches
    const localUrls = [
      'http://localhost:8787',
      'http://127.0.0.1:8787',
      'http://0.0.0.0:8787'
    ];

    for (const url of localUrls) {
      try {
        console.log(`📡 Trying to send ${message.type} notification to ${url}/notify`);
        await this.sendToWorker(url, gameId, message);
        console.log(`✅ Successfully sent notification via ${url}`);
        return; // Success, exit
      } catch (error) {
        console.log(`❌ Failed to send via ${url}:`, error.message);
        // Continue to next URL
      }
    }

    // If all local URLs fail, warn but don't crash
    console.warn(`⚠️ Could not send WebSocket notification for game ${gameId}. WebSocket worker might not be running.`);
    console.warn(`⚠️ Game will still work, but real-time updates might be delayed.`);
    console.warn(`⚠️ Make sure WebSocket worker is running: cd websocket-worker && npm run dev`);
  }

  /**
   * Send notification to a specific worker URL
   */
  private static async sendToWorker(workerUrl: string, gameId: string, message: any): Promise<void> {
    const response = await fetch(`${workerUrl}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'svelte-ttt-server' // Help identify the source
      },
      body: JSON.stringify({ gameId, message }),
      // Add timeout for local development
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response body');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json().catch(() => ({ success: true }));
    console.log(`✅ ${message.type} notification sent successfully to ${workerUrl}:`, result);
  }

  /**
   * Simple environment detection
   */
  static getEnvironmentInfo(platform: App.Platform) {
    const isLocalDevelopment = !platform?.env?.WEBSOCKET_HIBERNATION_SERVER;
    return {
      isLocalDevelopment,
      webSocketNotificationsAvailable: true // Always true since we just use HTTP
    };
  }

  /**
   * Health check for WebSocket worker
   */
  static async checkWebSocketWorker(): Promise<boolean> {
    const urls = [
      'http://localhost:8787/health',
      'http://127.0.0.1:8787/health'
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        if (response.ok) {
          console.log(`✅ WebSocket worker is running at ${url}`);
          return true;
        }
      } catch (error) {
        // Ignore errors, try next URL
      }
    }

    console.warn(`⚠️ WebSocket worker not detected. Start it with: cd websocket-worker && npm run dev`);
    return false;
  }
}
