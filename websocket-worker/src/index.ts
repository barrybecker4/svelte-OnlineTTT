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

      // Handle notification requests - route to Durable Object based on gameId in body
      if (url.pathname === '/notify' && request.method === 'POST') {
        try {
          // Parse the request body to get the gameId
          const body = await request.json() as { gameId: string; message: any };
          const gameId = body.gameId;

          if (!gameId || gameId.trim() === '') {
            console.error('Missing gameId in notify request body');
            return new Response(JSON.stringify({
              error: 'Game ID required in request body'
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          console.log('Routing notification to game:', gameId);

          // Create a unique Durable Object for this specific game
          const id = env.WEBSOCKET_HIBERNATION_SERVER.idFromName(`game-${gameId}`);
          const stub = env.WEBSOCKET_HIBERNATION_SERVER.get(id);

          // Recreate the request with the same body for the Durable Object
          const forwardRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(body)
          });

          // Forward the request to the Durable Object
          return stub.fetch(forwardRequest);

        } catch (error) {
          console.error('Error processing notify request:', error);
          return new Response(JSON.stringify({
            error: 'Failed to process notification request',
            details: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
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