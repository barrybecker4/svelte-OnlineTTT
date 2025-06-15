import type { GameState } from '../types/game.ts';

export interface GameMessage {
  type: 'gameUpdate' | 'playerJoined' | 'gameEnded' | 'error';
  gameId: string;
  data: any;
  timestamp: number;
}

export class WebSocketHibernationServer implements DurableObject {
  private sessions: Map<string, WebSocket> = new Map();
  private gameSubscriptions: Map<string, Set<string>> = new Map(); // gameId -> Set of sessionIds

  constructor(private state: DurableObjectState, private env: any) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected websocket', { status: 400 });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      const sessionId = this.generateSessionId();
      this.sessions.set(sessionId, server);

      server.accept();

      server.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data as string);
          this.handleMessage(sessionId, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.sendToSession(sessionId, {
            type: 'error',
            gameId: '',
            data: { error: 'Invalid message format' },
            timestamp: Date.now()
          });
        }
      });

      server.addEventListener('close', () => {
        this.handleDisconnect(sessionId);
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // HTTP endpoint for sending game updates from API routes
    if (url.pathname === '/notify' && request.method === 'POST') {
      try {
        const { gameId, message } = await request.json();
        await this.broadcastToGame(gameId, message);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to send notification' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not found', { status: 404 });
  }

  private handleMessage(sessionId: string, message: any) {
    switch (message.type) {
      case 'subscribe':
        this.subscribeToGame(sessionId, message.gameId, message.playerId);
        break;
      case 'unsubscribe':
        this.unsubscribeFromGame(sessionId, message.gameId);
        break;
      case 'ping':
        this.sendToSession(sessionId, {
          type: 'pong',
          gameId: '',
          data: {},
          timestamp: Date.now()
        });
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private subscribeToGame(sessionId: string, gameId: string, playerId: string) {
    if (!this.gameSubscriptions.has(gameId)) {
      this.gameSubscriptions.set(gameId, new Set());
    }

    this.gameSubscriptions.get(gameId)!.add(sessionId);

    // Store player info for this session
    this.state.storage.put(`session:${sessionId}:playerId`, playerId);
    this.state.storage.put(`session:${sessionId}:gameId`, gameId);

    console.log(`Session ${sessionId} subscribed to game ${gameId} as player ${playerId}`);

    // Confirm subscription
    this.sendToSession(sessionId, {
      type: 'subscribed',
      gameId,
      data: { playerId },
      timestamp: Date.now()
    });
  }

  private unsubscribeFromGame(sessionId: string, gameId: string) {
    const subscribers = this.gameSubscriptions.get(gameId);
    if (subscribers) {
      subscribers.delete(sessionId);
      if (subscribers.size === 0) {
        this.gameSubscriptions.delete(gameId);
      }
    }

    this.state.storage.delete(`session:${sessionId}:playerId`);
    this.state.storage.delete(`session:${sessionId}:gameId`);

    console.log(`Session ${sessionId} unsubscribed from game ${gameId}`);
  }

  private handleDisconnect(sessionId: string) {
    // Clean up subscriptions
    for (const [gameId, subscribers] of this.gameSubscriptions.entries()) {
      if (subscribers.has(sessionId)) {
        subscribers.delete(sessionId);
        if (subscribers.size === 0) {
          this.gameSubscriptions.delete(gameId);
        }
      }
    }

    // Clean up session data
    this.state.storage.delete(`session:${sessionId}:playerId`);
    this.state.storage.delete(`session:${sessionId}:gameId`);
    this.sessions.delete(sessionId);

    console.log(`Session ${sessionId} disconnected and cleaned up`);
  }

  private async broadcastToGame(gameId: string, message: GameMessage) {
    const subscribers = this.gameSubscriptions.get(gameId);
    if (!subscribers) {
      console.log(`No subscribers for game ${gameId}`);
      return;
    }

    console.log(`Broadcasting to ${subscribers.size} subscribers for game ${gameId}:`, message.type);

    const promises = Array.from(subscribers).map(sessionId => {
      return this.sendToSession(sessionId, message);
    });

    await Promise.all(promises);
  }

  private sendToSession(sessionId: string, message: GameMessage): Promise<void> {
    return new Promise((resolve) => {
      const ws = this.sessions.get(sessionId);
      if (ws && ws.readyState === ws.OPEN) {
        try {
          ws.send(JSON.stringify(message));
          resolve();
        } catch (error) {
          console.error(`Error sending to session ${sessionId}:`, error);
          this.sessions.delete(sessionId);
          resolve();
        }
      } else {
        console.log(`Session ${sessionId} not found or not open`);
        this.sessions.delete(sessionId);
        resolve();
      }
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Helper function for API routes to send notifications
export async function notifyGameUpdate(
  gameId: string,
  gameState: GameState,
  durableObject: DurableObjectNamespace
): Promise<void> {
  const id = durableObject.idFromName('websocket-server');
  const stub = durableObject.get(id);

  const message: GameMessage = {
    type: 'gameUpdate',
    gameId,
    data: {
      board: gameState.board,
      status: gameState.status,
      nextPlayer: gameState.lastPlayer === '' ? 'X' : (gameState.lastPlayer === 'X' ? 'O' : 'X'),
      lastPlayer: gameState.lastPlayer,
      lastMoveAt: gameState.lastMoveAt
    },
    timestamp: Date.now()
  };

  try {
    await stub.fetch('http://internal/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, message })
    });
  } catch (error) {
    console.error('Failed to notify game update:', error);
  }
}

export async function notifyPlayerJoined(
  gameId: string,
  gameState: GameState,
  durableObject: DurableObjectNamespace
): Promise<void> {
  const id = durableObject.idFromName('websocket-server');
  const stub = durableObject.get(id);

  const message: GameMessage = {
    type: 'playerJoined',
    gameId,
    data: {
      board: gameState.board,
      status: gameState.status,
      player1: gameState.player1.name,
      player1Id: gameState.player1.id,
      player2: gameState.player2?.name || null,
      player2Id: gameState.player2?.id || null,
      nextPlayer: 'X', // Game just started, X goes first
      lastPlayer: gameState.lastPlayer,
      lastMoveAt: gameState.lastMoveAt
    },
    timestamp: Date.now()
  };

  try {
    await stub.fetch('http://internal/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, message })
    });
  } catch (error) {
    console.error('Failed to notify player joined:', error);
  }
}