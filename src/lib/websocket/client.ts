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
export type ConnectedCallback = () => void;
export type DisconnectedCallback = () => void;

export class GameWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: number | null = null;
  private isConnecting = false;
  private currentGameId: string | null = null;

  private callbacks: {
    gameUpdate?: GameUpdateCallback;
    playerJoined?: PlayerJoinedCallback;
    error?: ErrorCallback;
    connected?: ConnectedCallback;
    disconnected?: DisconnectedCallback;
  } = {};

  constructor(private baseUrl: string = '') {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected()) {
          this.connect();
        }
      });
    }
  }

  onConnected(callback: ConnectedCallback): void {
    this.callbacks.connected = callback;
  }

  onDisconnected(callback: DisconnectedCallback): void {
    this.callbacks.disconnected = callback;
  }

  async connect(gameId?: string): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    // Store the gameId for reconnections
    if (gameId) {
      this.currentGameId = gameId;
    }

    this.isConnecting = true;

    try {
      const wsUrl = this.getWebSocketUrl(this.currentGameId);
      console.log('Connecting to WebSocket:', wsUrl);

      // Connect directly - no availability checks needed
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected for game:', this.currentGameId);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startPing();

        if (this.callbacks.connected) {
          this.callbacks.connected();
        }
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

        // Call the disconnected callback
        if (this.callbacks.disconnected) {
          this.callbacks.disconnected();
        }

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
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
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
    // First connect with the specific gameId
    this.connect(gameId).then(() => {
      if (this.isConnected()) {
        this.send({
          type: 'subscribe',
          gameId,
          playerId
        });
      }
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

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect(); // Will use stored currentGameId
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