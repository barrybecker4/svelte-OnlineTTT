export class WebSocketHibernationServer implements DurableObject {
  private sessions: Map<string, { ws: WebSocket; gameId?: string }> = new Map();

  constructor(private state: DurableObjectState, private env: any) {
    console.log('🎯 Global WebSocket Durable Object created');
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

  // Transforms regular HTTP request into a WebSocket connection
  private handleWebSocketUpgrade(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const url = new URL(request.url);
    const gameId = url.searchParams.get('gameId');

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    const sessionId = this.generateSessionId();

    // Store WebSocket with its game ID
    this.sessions.set(sessionId, { ws: server, gameId: gameId || undefined });

    server.accept();

    console.log(`📡 WebSocket connected - Game: ${gameId}, Session: ${sessionId}, Total sessions: ${this.sessions.size}`);

    server.addEventListener('message', event => {
      try {
        const message = JSON.parse(event.data as string);
        this.handleMessage(sessionId, message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    });

    server.addEventListener('close', () => {
      console.log(`🔌 WebSocket disconnected: ${sessionId}`);
      this.sessions.delete(sessionId);
      console.log(`📊 Remaining sessions: ${this.sessions.size}`);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  private handleMessage(sessionId: string, message: any): void {
    console.log(`📨 Received WebSocket message: ${message.type} from session: ${sessionId}`);

    if (message.type === 'subscribe' && message.gameId) {
      // Update the game ID for this session
      const session = this.sessions.get(sessionId);
      if (session) {
        session.gameId = message.gameId;
        console.log(`✅ Session ${sessionId} subscribed to game: ${message.gameId}`);
        this.logGameSubscriptions();

        // Send confirmation
        this.sendToSession(sessionId, {
          type: 'subscribed',
          gameId: message.gameId,
          timestamp: Date.now()
        });
      }
    }

    if (message.type === 'ping') {
      this.sendToSession(sessionId, {
        type: 'pong',
        timestamp: Date.now()
      });
    }
  }

  private async handleNotification(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { gameId: string; message: any };
      const { gameId, message } = body;

      console.log(`📢 Broadcasting ${message.type} for game ${gameId}`);

      // Log current sessions before broadcasting
      console.log(`📊 Current sessions: ${this.sessions.size}`);
      this.logGameSubscriptions();

      // Broadcast to ALL sessions for this game ID
      let broadcastCount = 0;
      let targetSessions: string[] = [];

      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.gameId === gameId) {
          targetSessions.push(sessionId);
          try {
            session.ws.send(JSON.stringify(message));
            broadcastCount++;
            console.log(`  ✅ Sent to session ${sessionId}`);
          } catch (error) {
            console.error(`  ❌ Failed to send to session ${sessionId}:`, error);
            // Clean up dead connections
            this.sessions.delete(sessionId);
          }
        }
      }

      console.log(`📊 Broadcast complete: ${broadcastCount} sessions reached for game ${gameId}`);
      console.log(`🎯 Target sessions were: [${targetSessions.join(', ')}]`);

      return new Response(JSON.stringify({
        success: true,
        broadcastCount,
        gameId,
        messageType: message.type,
        targetSessions
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('❌ WebSocket notification error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private sendToSession(sessionId: string, message: any): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        session.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`❌ Failed to send to session ${sessionId}:`, error);
        this.sessions.delete(sessionId);
      }
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logGameSubscriptions(): void {
    const gameSubscriptions: { [gameId: string]: string[] } = {};

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.gameId) {
        if (!gameSubscriptions[session.gameId]) {
          gameSubscriptions[session.gameId] = [];
        }
        gameSubscriptions[session.gameId].push(sessionId);
      }
    }

    console.log(`🎮 Game subscriptions:`, gameSubscriptions);
  }
}
