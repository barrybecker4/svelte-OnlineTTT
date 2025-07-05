import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { WebSocketNotificationHelper } from '$lib/server/WebSocketNotificationHelper.js';

export const GET: RequestHandler = async () => {
  console.log('🏥 Checking WebSocket worker health...');

  const isHealthy = await WebSocketNotificationHelper.checkWebSocketWorker();

  return json({
    websocketWorker: {
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy
        ? 'WebSocket worker is running and accessible'
        : 'WebSocket worker is not accessible. Make sure to run: cd websocket-worker && npm run dev'
    },
    timestamp: new Date().toISOString()
  }, {
    status: isHealthy ? 200 : 503
  });
};
