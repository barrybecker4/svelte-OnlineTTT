export { WebSocketHibernationServer } from './websocket.ts';

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response('WebSocket service is running', { status: 200 });
    }

    // Route WebSocket and notification requests to Durable Object
    if (url.pathname === '/websocket' || url.pathname === '/notify') {
      // Route ALL requests to the SAME Durable Object instance
      // This ensures WebSocket connections and notifications go to the same place
      const id = env.WEBSOCKET_HIBERNATION_SERVER.idFromName('global-websocket-handler');
      const durableObject = env.WEBSOCKET_HIBERNATION_SERVER.get(id);

      console.log(`🎯 Routing ${url.pathname} to global Durable Object instance`);

      // Forward the request to the Durable Object
      return await durableObject.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
