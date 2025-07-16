import type { GameMessage } from '../types/websocket.js';

export class SessionManager {
  private sessions: Map<string, WebSocket> = new Map(); // session id to websocket
  private gameSubscriptions: Map<string, Set<string>> = new Map(); // gameId to subscribers
  private storage: DurableObjectStorage;

  constructor(storage: DurableObjectStorage) {
    this.storage = storage;
  }

  addSession(sessionId: string, ws: WebSocket): void {
    this.sessions.set(sessionId, ws);
  }

  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);

    // Clean up any game subscriptions for this session
    for (const [gameId, subscribers] of this.gameSubscriptions.entries()) {
      if (subscribers.has(sessionId)) {
        subscribers.delete(sessionId);
        if (subscribers.size === 0) {
          this.gameSubscriptions.delete(gameId);
        }
      }
    }
  }

  async subscribeToGame(sessionId: string, gameId: string, playerId: string): Promise<void> {
    if (!this.gameSubscriptions.has(gameId)) {
      this.gameSubscriptions.set(gameId, new Set());
    }

    this.gameSubscriptions.get(gameId)!.add(sessionId);

    // Store player info for this session in storage
    await this.storage.put(`session:${sessionId}:playerId`, playerId);
    await this.storage.put(`session:${sessionId}:gameId`, gameId);

    console.log(`Player ${playerId} subscribed to game ${gameId} (session: ${sessionId})`);
  }

  unsubscribeFromGame(sessionId: string, gameId: string): void {
    const subscribers = this.gameSubscriptions.get(gameId);
    if (subscribers) {
      subscribers.delete(sessionId);
      if (subscribers.size === 0) {
        this.gameSubscriptions.delete(gameId);
      }
    }
    console.log(`Session ${sessionId} unsubscribed from game ${gameId}`);
  }

  /** Get all session IDs subscribed to a game */
  getGameSubscribers(gameId: string): string[] {
    const subscribers = this.gameSubscriptions.get(gameId);
    return subscribers ? Array.from(subscribers) : [];
  }

  async sendToSession(sessionId: string, message: GameMessage): Promise<void> {
    const ws = this.sessions.get(sessionId);
    if (ws && ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending to session ${sessionId}:`, error);
        this.removeSession(sessionId);
      }
    } else {
      console.log(`Session ${sessionId} not found or not open`);
      this.removeSession(sessionId);
    }
  }

  async broadcastToGame(gameId: string, message: GameMessage): Promise<void> {
    const subscribers = this.getGameSubscribers(gameId);
    if (subscribers.length === 0) {
      console.log(`No subscribers for game ${gameId}`);
      return;
    }

    console.log(`Broadcasting to ${subscribers.length} subscribers for game ${gameId}:`, message.type);

    const promises = subscribers.map(sessionId =>
      this.sendToSession(sessionId, message)
    );

    await Promise.all(promises);
  }

  async recoverSubscriptions(): Promise<void> {
    try {
      const storageData = await this.storage.list();

      for (const [key, value] of storageData) {
        if (typeof key === 'string' && key.startsWith('session:') && key.endsWith(':gameId')) {
          const sessionId = key.split(':')[1];
          const gameId = value as string;

          if (!this.gameSubscriptions.has(gameId)) {
            this.gameSubscriptions.set(gameId, new Set());
          }
          this.gameSubscriptions.get(gameId)!.add(sessionId);
        }
      }

      console.log('Recovered subscriptions for games:', Array.from(this.gameSubscriptions.keys()));
    } catch (error) {
      console.error('Failed to recover subscriptions:', error);
    }
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
