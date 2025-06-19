// websocket-worker/src/index.ts
import { WebSocketHibernationServer } from '../../src/lib/server/websocket';

// Export the Durable Object class - this is required for Cloudflare to recognize it
export { WebSocketHibernationServer };

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    try {
      const url = new URL(request.url);

      // Handle WebSocket upgrade requests
      if (request.headers.get('Upgrade') === 'websocket') {
        // Extract gameId from URL query parameter
        const gameId = url.searchParams.get('gameId');

        if (!gameId || gameId.trim() === '') {
          console.error('Missing gameId in WebSocket request:', url.toString());
          return new Response('Game ID required in query parameter', { status: 400 });
        }

        console.log('Creating Durable Object for game:', gameId);

        // Create a unique Durable Object for this specific game
        const id = env.WEBSOCKET_HIBERNATION_SERVER.idFromName(`game-${gameId}`);
        const stub = env.WEBSOCKET_HIBERNATION_SERVER.get(id);

        // Forward the request to the Durable Object
        return stub.fetch(request);
      }

      // Handle health check requests
      if (url.pathname === '/health') {
        return new Response('WebSocket service is running', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Handle other requests
      return new Response('WebSocket service. Connect with ?gameId=<your-game-id>', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};
