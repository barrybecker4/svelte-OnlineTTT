/**
 * Handles generic WebSocket connection management
 */
import { ConnectionPromise } from './ConnectionPromise.js';

export type MessageHandler = (data: any) => void;

export interface WebSocketManagerOptions {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private connectionPromise = new ConnectionPromise();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  private readonly maxReconnectAttempts: number;
  private readonly reconnectDelay: number;
  private readonly pingIntervalMs: number;

  private messageHandler: MessageHandler | null = null;
  private closeHandler: ((event: CloseEvent) => void) | null = null;
  private errorHandler: ((error: Event) => void) | null = null;

  constructor(options: WebSocketManagerOptions = {}) {
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.reconnectDelay = options.reconnectDelay ?? 1000;
    this.pingIntervalMs = options.pingInterval ?? 30000;
  }

  /**
   * Connect to WebSocket at the given URL
   */
  async connect(url: string): Promise<void> {
    if (this.isConnected()) {
      return Promise.resolve();
    }

    if (this.connectionPromise.exists()) {
      return this.connectionPromise.get()!;
    }

    this.isConnecting = true;
    const promise = this.connectionPromise.create();

    try {
      // Close existing connection if any
      if (this.ws) {
        this.ws.close(1000, 'Reconnecting');
        this.ws = null;
      }

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected to:', url);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startPing();
        this.connectionPromise.resolveAndClear();
      };

      this.ws.onmessage = (event) => {
        if (this.messageHandler) {
          try {
            const data = JSON.parse(event.data);
            this.messageHandler(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.stopPing();
        this.connectionPromise.clear();

        if (this.closeHandler) {
          this.closeHandler(event);
        }

        // Auto-reconnect logic (if enabled)
        if (event.code !== 1000 && this.shouldReconnect(event.code)) {
          this.scheduleReconnect(url);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.connectionPromise.rejectAndClear(error as Error);

        if (this.errorHandler) {
          this.errorHandler(error);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.connectionPromise.rejectAndClear(error as Error);
    }

    return promise;
  }

  /**
   * Send a message through the WebSocket
   */
  send(data: any): boolean {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }
  }

  /**
   * Disconnect the WebSocket
   */
  disconnect(): void {
    this.stopPing();
    this.connectionPromise.clear();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Wait for connection to be established
   */
  async waitForConnection(maxWaitMs: number = 5000): Promise<boolean> {
    if (this.isConnected()) {
      return true;
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

  /**
   * Set message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Set close handler
   */
  onClose(handler: (event: CloseEvent) => void): void {
    this.closeHandler = handler;
  }

  /**
   * Set error handler
   */
  onError(handler: (error: Event) => void): void {
    this.errorHandler = handler;
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, this.pingIntervalMs);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private shouldReconnect(closeCode: number): boolean {
    // Don't reconnect on service unavailable errors
    return closeCode !== 1011 && closeCode !== 1012 && this.reconnectAttempts < this.maxReconnectAttempts;
  }

  private scheduleReconnect(url: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect(url);
    }, delay);
  }
}
