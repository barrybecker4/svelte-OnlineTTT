import type { GameState } from '../types/game.js';

// Update with your deployed worker URL
const WORKER_URL = 'https://svelte-ttt-websocket.barrybecker4.workers.dev';

const LOCAL_URLS = [
  'http://localhost:8787',
  'http://127.0.0.1:8787',
];

export class WebSocketNotificationHelper {

  /**
   * Send a player joined notification
   */
  static async sendPlayerJoined(gameState: GameState, platform: App.Platform): Promise<void> {
    console.log(`🔔 Sending playerJoined notification for game ${gameState.gameId}`);
    const message = this.createMessage(gameState, 'playerJoined', 'X');
    await this.sendNotification(gameState.gameId, message, platform);
  }

  /**
   * Send a game update notification
   */
  static async sendGameUpdate(gameState: GameState, platform: App.Platform): Promise<void> {
    console.log(`🔔 Sending gameUpdate notification for game ${gameState.gameId}`);

    const nextPlayer = gameState.lastPlayer === '' ? 'X' :
      gameState.lastPlayer === 'X' ? 'O' : 'X';

    const message = this.createMessage(gameState, 'gameUpdate', nextPlayer);
    await this.sendNotification(gameState.gameId, message, platform);
  }

  private static createMessage(gameState: GameState, type: string, nextPlayer: string) {
    return {
      type,
      gameId: gameState.gameId,
      data: {
        ...gameState,
        nextPlayer
      },
      timestamp: Date.now()
    };
  }

  /**
   * HTTP POST to WebSocket worker with retry and fallback
   */
  private static async sendNotification(gameId: string, message: any, platform: App.Platform): Promise<void> {
    const isLocalDevelopment = this.isLocalDev(platform);

    if (!isLocalDevelopment) {
      if (await this.sendMessageToWorker(WORKER_URL, message, gameId)) {
        return;
      }
    }

    for (const url of LOCAL_URLS) {
      if (await this.sendMessageToWorker(url, message, gameId)) {
        return;
      }
    }

    this.logWarning(gameId);
  }

  private static async sendMessageToWorker(workerUrl: string, message: any, gameId: string): Promise<boolean> {
    try {
      await this.sendToWorker(workerUrl, gameId, message);
      console.log(`✅ Successfully sent notification via ${workerUrl}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send to worker:`, error);
      return false;
    }
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
      signal: AbortSignal.timeout(4000)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response body');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json().catch(() => ({ success: true }));
    console.log(`✅ ${message.type} notification sent successfully to ${workerUrl}:`, result);
  }

  private static logWarning(gameId: string) {
    console.warn(`⚠️ Could not send WebSocket notification for game ${gameId}. WebSocket worker might not be running.`);
    console.warn(`⚠️ Make sure WebSocket worker is running: cd websocket-worker && npm run dev`);
  }

  /**
   * Simple environment detection
   */
  static getEnvironmentInfo(platform: App.Platform) {
    const isLocalDevelopment = this.isLocalDev(platform);
    return {
      isLocalDevelopment,
      webSocketNotificationsAvailable: true // Always true since we just use HTTP
    };
  }

  /**
   * Health check for WebSocket worker
   */
  static async checkWebSocketWorker(): Promise<boolean> {
    const urls = LOCAL_URLS.map(url => url + '/health');

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
        console.log('Could not reach websocket worker.', error);
      }
    }

    console.warn(`⚠️ WebSocket worker not detected. Start it with: cd websocket-worker && npm run dev`);
    return false;
  }

  private static isLocalDev(platform: App.Platform): boolean {
    return !platform?.env?.WEBSOCKET_HIBERNATION_SERVER;
  }
}
