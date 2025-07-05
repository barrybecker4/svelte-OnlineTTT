import { buildWebSocketUrl } from './urlBuilder.ts';

export class GameWebSocketClient {
  private ws: WebSocket | null = null;
  private gameId: string | null = null;
  private callbacks: {
    gameUpdate?: (data: any) => void;
    playerJoined?: (data: any) => void;
    error?: (error: string) => void;
  } = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  async connect(gameId: string): Promise<void> {
    this.gameId = gameId;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = buildWebSocketUrl(gameId);
        console.log('Connecting to WebSocket:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;

          // Subscribe to this game
          this.send({
            type: 'subscribe',
            gameId: gameId
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);

          // Try to reconnect if it wasn't a clean close and we haven't exceeded max attempts
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
            this.reconnectAttempts++;
            setTimeout(() => {
              if (this.gameId) {
                this.connect(this.gameId);
              }
            }, 1000 * this.reconnectAttempts); // Exponential backoff
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(new Error('WebSocket connection failed'));
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.gameId = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send(message: any): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  onGameUpdate(callback: (data: any) => void): void {
    this.callbacks.gameUpdate = callback;
  }

  onPlayerJoined(callback: (data: any) => void): void {
    this.callbacks.playerJoined = callback;
  }

  onError(callback: (error: string) => void): void {
    this.callbacks.error = callback;
  }

  private handleMessage(message: any): void {
    console.log('📩 Received WebSocket message:', message.type, message.gameId);

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
        console.log('✅ Successfully subscribed to game:', message.gameId);
        break;

      case 'pong':
        // Keep-alive response
        break;

      case 'error':
        console.error('❌ WebSocket error message:', message);
        if (this.callbacks.error) {
          this.callbacks.error(message.error || 'Unknown WebSocket error');
        }
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  // Simple ping to keep connection alive
  ping(): void {
    this.send({ type: 'ping' });
  }

  // Start a ping interval to keep connection alive
  startPinging(intervalMs: number = 30000): void {
    setInterval(() => {
      if (this.isConnected()) {
        this.ping();
      }
    }, intervalMs);
  }
}
