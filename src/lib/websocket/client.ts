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
  private reconnectDelay = 1000; // Start with 1 second
  private pingInterval: number | null = null;
  private isConnecting = false;

  private callbacks: {
    gameUpdate?: GameUpdateCallback;
    playerJoined?: PlayerJoinedCallback;
    error?: ErrorCallback;
  } = {};

  constructor(private baseUrl: string = '') {
    if (typeof window !== 'undefined') {
      // Auto-reconnect on page visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected()) {
          this.connect();
        }
      });
    }
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = this.getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);

      // First check if the WebSocket service is available
      try {
        const checkResponse = await fetch('/api/websocket', { method: 'HEAD' });
        if (checkResponse.status === 503) {
          console.log('WebSocket service not available, skipping WebSocket functionality');
          this.isConnecting = false;
          return;
        }
      } catch (fetchError) {
        console.log('Cannot check WebSocket availability, skipping WebSocket functionality');
        this.isConnecting = false;
        return;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: GameMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.stopPing();

        // Only try to reconnect if it's not a service unavailable error
        if (event.code !== 1011 && event.code !== 1012) {
          this.scheduleReconnect();
        } else {
          console.log('WebSocket service unavailable, not attempting reconnect');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        // Don't call error callback for connection failures in production
        // The user doesn't need to see these alerts
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      // Don't schedule reconnect if we can't even create the connection
    }
  }

  disconnect(): void {
    this.stopPing();
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

      if (!this.isConnecting && !this.ws) {
        await this.connect();
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
      if (!this.isConnected()) {
        console.warn('WebSocket not connected, attempting to connect first...');
        this.connect().then(() => {
          if (this.isConnected()) {
            this.send({
              type: 'subscribe',
              gameId,
              playerId
            });
          }
        });
        return;
      }

      console.log(`Subscribing to game ${gameId} as player ${playerId}`);
      this.send({
        type: 'subscribe',
        gameId,
        playerId
      });
    }

    unsubscribeFromGame(gameId: string): void {
      if (!this.isConnected()) {
        return;
      }

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

  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = this.baseUrl || window.location.host;
    return `${protocol}//${host}/api/websocket`;
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
      // Don't show error to user, just log it
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect();
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
