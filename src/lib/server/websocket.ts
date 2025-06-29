import { SessionManager } from './SessionManager.js';
import type { GameMessage } from '../types/websocket.js';

export class WebSocketHibernationServer implements DurableObject {
  private sessionManager: SessionManager;

  constructor(private state: DurableObjectState, private env: any) {
    this.sessionManager = new SessionManager(state.storage);
    // Recover subscriptions from storage after hibernation/restart
    this.sessionManager.recoverSubscriptions();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    if (url.pathname === '/notify' && request.method === 'POST') {
      return this.handleNotification(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private handleWebSocketUpgrade(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    const sessionId = this.sessionManager.generateSessionId();
    this.sessionManager.addSession(sessionId, server);

    server.accept();

    server.addEventListener('message', event => {
      try {
        const message = JSON.parse(event.data as string);
        this.handleMessage(sessionId, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sessionManager.sendToSession(sessionId, {
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
      webSocket: client
    });
  }

  private async handleNotification(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { gameId: string; message: GameMessage };
      const { gameId, message } = body;
      
      await this.sessionManager.broadcastToGame(gameId, message);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('WebSocket notification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ 
        error: 'Failed to send notification',
        details: errorMessage 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private handleMessage(sessionId: string, message: any) {
    switch (message.type) {
      case 'subscribe':
        this.sessionManager.subscribeToGame(sessionId, message.gameId, message.playerId);
        this.sessionManager.sendToSession(sessionId, {
          type: 'subscribed',
          gameId: message.gameId,
          data: { playerId: message.playerId },
          timestamp: Date.now()
        });
        break;
        
      case 'unsubscribe':
        this.sessionManager.unsubscribeFromGame(sessionId, message.gameId);
        break;
        
      case 'ping':
        this.sessionManager.sendToSession(sessionId, {
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

  private async handleDisconnect(sessionId: string) {
    console.log(`Session ${sessionId} disconnected`);
    this.sessionManager.removeSession(sessionId);
    
    // Optional: Notify game service about player disconnect
    // This could trigger game termination logic if needed
  }
}
