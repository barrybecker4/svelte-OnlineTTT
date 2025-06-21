import type { GameState } from '../types/game.ts';

export interface GameMessage {
  type: 'gameUpdate' | 'playerJoined' | 'gameEnded' | 'error' | 'subscribed' | 'pong';
  gameId: string;
  data: any;
  timestamp: number;
}

export type GameUpdateCallback = (data: any) => void;
export type PlayerJoinedCallback = (data: any) => void;
export type ErrorCallback = (error: string) => void;

export class GameWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: number | null = null;
  private isConnecting = false;
  private currentGameId: string | null = null;
  private connectionPromise: Promise<void> | null = null;

  private callbacks: {
    gameUpdate?: GameUpdateCallback;
    playerJoined?: PlayerJoinedCallback;
    error?: ErrorCallback;
  } = {};

  constructor(private baseUrl: string = '') {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected() && this.currentGameId) {
          this.connect(this.currentGameId);
        }
      });
    }
  }

  async connect(gameId?: string): Promise<void> {
    // Don't allow connections without a gameId
    if (!gameId && !this.currentGameId) {
      console.warn('Cannot connect to WebSocket without a gameId');
      return;
    }

    // If already connecting or connected to the same gameId, return existing promise or resolve immediately
    if (gameId && this.currentGameId === gameId) {
      if (this.isConnected()) {
        return Promise.resolve();
      }
      if (this.connectionPromise) {
        return this.connectionPromise;
      }
    }

    // Store the gameId for reconnections
    if (gameId) {
      this.currentGameId = gameId;
    }

    // Don't start a new connection if one is already in progress for the same game
    if (this.isConnecting) {
      return this.connectionPromise || Promise.resolve();
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      try {
        const wsUrl = this.getWebSocketUrl(this.currentGameId!);
        console.log('Connecting to WebSocket:', wsUrl);

        // Validate that we have a gameId in the URL
        if (!wsUrl.includes('gameId=')) {
          const error = new Error('Cannot connect without gameId parameter');
          console.error(error.message);
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(error);
          return;
        }

        // Disconnect existing connection if any
        if (this.ws) {
          this.ws.close(1000, 'Reconnecting');
          this.ws = null;
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected for game:', this.currentGameId);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startPing();
          this.connectionPromise = null;
          resolve();
        };

        this.ws.onmessage = event => {
          try {
            const message: GameMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = event => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPing();
          this.connectionPromise = null;

          // Only try to reconnect if it's not a service unavailable error and we have a gameId
          if (event.code !== 1011 && event.code !== 1012 && this.currentGameId) {
            this.scheduleReconnect();
          } else {
            console.log('WebSocket service unavailable or no gameId, not attempting reconnect');
          }

          // If this was an unexpected close, reject the promise
          if (event.code !== 1000 && this.connectionPromise) {
            reject(new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`));
          }
        };

        this.ws.onerror = error => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(error);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    this.stopPing();
    this.currentGameId = null; // Clear gameId to prevent reconnection attempts
    this.connectionPromise = null;

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public async waitForConnection(maxWaitMs: number = 5000): Promise<boolean> {
    if (this.isConnected()) {
      return true;
    }

    if (!this.currentGameId) {
      console.warn('Cannot wait for connection without a gameId');
      return false;
    }

    // Start connection if not already connecting
    if (!this.isConnecting && !this.ws) {
      await this.connect(this.currentGameId).catch(() => {
        // Connection failed, but we'll still wait to see if it eventually connects
      });
    }

    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      if (this.isConnected()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return false;
  }

  subscribeToGame(gameId: string, playerId: string): void {
    if (!gameId) {
      console.error('Cannot subscribe to game without gameId');
      return;
    }

    // Connect with the specific gameId and then subscribe
    this.connect(gameId)
      .then(() => {
        if (this.isConnected()) {
          console.log('Subscribing to game:', gameId, 'as player:', playerId);
          this.send({
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
    this.send({
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

  private getWebSocketUrl(gameId?: string): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Always use the deployed WebSocket worker for simplicity
    // This avoids complex local development setup issues
    const host = 'svelte-ttt-websocket.barrybecker4.workers.dev';

    // Build the WebSocket URL
    let wsUrl = `${protocol}//${host}/websocket`;

    // Add gameId as query parameter if provided
    if (gameId) {
      wsUrl += `?gameId=${encodeURIComponent(gameId)}`;
    }

    console.log('WebSocket URL:', wsUrl);
    return wsUrl;
  }

  private send(data: any): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  private handleMessage(message: GameMessage): void {
    console.log('Received WebSocket message:', message.type, message.gameId);

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

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached, giving up on WebSocket');
      return;
    }

    if (!this.currentGameId) {
      console.log('No gameId available for reconnection');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.currentGameId) {
        this.connect(this.currentGameId);
      }
    }, delay);
  }
}

// Global WebSocket client instance
let wsClient: GameWebSocketClient | null = null;

export function getWebSocketClient(): GameWebSocketClient {
  if (!wsClient) {
    wsClient = new GameWebSocketClient();
  }
  return wsClient;
}
