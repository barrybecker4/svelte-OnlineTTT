import { WebSocketManager } from './WebSocketManager.js';
import { buildWebSocketUrl } from './urlBuilder.js';
import type { GameMessage } from '../types/websocket.js';

export type GameUpdateCallback = (data: any) => void;
export type PlayerJoinedCallback = (data: any) => void;
export type ErrorCallback = (error: string) => void;

export class GameWebSocketClient {
  private wsManager: WebSocketManager;
  private currentGameId: string | null = null;

  private callbacks: {
    gameUpdate?: GameUpdateCallback;
    playerJoined?: PlayerJoinedCallback;
    error?: ErrorCallback;
  } = {};

  constructor() {
    this.wsManager = new WebSocketManager({
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      pingInterval: 30000
    });

    this.wsManager.onMessage((data) => this.handleMessage(data));
    this.wsManager.onClose((event) => this.handleClose(event));
    this.wsManager.onError((error) => this.handleError(error));
  }

  async connect(gameId: string): Promise<void> {
    if (!gameId) {
      console.warn('Cannot connect to WebSocket without a gameId');
      return;
    }

    // If already connected to the same game, return immediately
    if (this.currentGameId === gameId && this.wsManager.isConnected()) {
      return Promise.resolve();
    }

    this.currentGameId = gameId;
    const wsUrl = buildWebSocketUrl(gameId);
    
    console.log('Connecting to game WebSocket:', gameId);
    return this.wsManager.connect(wsUrl);
  }

  disconnect(): void {
    this.currentGameId = null;
    this.wsManager.disconnect();
  }

  isConnected(): boolean {
    return this.wsManager.isConnected();
  }

  async waitForConnection(maxWaitMs: number = 5000): Promise<boolean> {
    return this.wsManager.waitForConnection(maxWaitMs);
  }

  subscribeToGame(gameId: string, playerId: string): void {
    if (!gameId) {
      console.error('Cannot subscribe to game without gameId');
      return;
    }

    this.connect(gameId)
      .then(() => {
        if (this.isConnected()) {
          console.log('Subscribing to game:', gameId, 'as player:', playerId);
          this.wsManager.send({
            type: 'subscribe',
            gameId,
            playerId
          });
        } else {
          console.warn('Cannot subscribe: WebSocket not connected');
        }
      })
      .catch(error => {
        console.error('Failed to connect for subscription:', error);
      });
  }

  unsubscribeFromGame(gameId: string): void {
    if (!gameId) {
      console.error('Cannot unsubscribe from game without gameId');
      return;
    }

    if (!this.isConnected()) {
      console.warn('Cannot unsubscribe: WebSocket not connected');
      return;
    }

    console.log('Unsubscribing from game:', gameId);
    this.wsManager.send({
      type: 'unsubscribe',
      gameId
    });
  }

  onGameUpdate(callback: GameUpdateCallback): void {
    this.callbacks.gameUpdate = callback;
  }

  onPlayerJoined(callback: PlayerJoinedCallback): void {
    this.callbacks.playerJoined = callback;
  }

  onError(callback: ErrorCallback): void {
    this.callbacks.error = callback;
  }

  private handleMessage(message: GameMessage): void {
    console.log('Received game message:', message.type, message.gameId);

    switch (message.type) {
      case 'gameUpdate':
        if (this.callbacks.gameUpdate) {
          this.callbacks.gameUpdate(message.data);
        }
        break;

      case 'playerJoined':
        if (this.callbacks.playerJoined) {
          this.callbacks.playerJoined(message.data);
        }
        break;

      case 'subscribed':
        console.log('Successfully subscribed to game:', message.gameId);
        break;

      case 'pong':
        // Response to ping, connection is alive
        break;

      case 'error':
        console.error('WebSocket error message:', message.data);
        if (this.callbacks.error) {
          this.callbacks.error(message.data.error || 'Unknown error');
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleClose(event: CloseEvent): void {
    // Game-specific close handling could go here
    console.log('Game WebSocket closed:', event.code, event.reason);
  }

  private handleError(error: Event): void {
    // Game-specific error handling could go here
    console.error('Game WebSocket error:', error);
  }
}
