import type { RequestHandler } from './$types.ts';

export const GET: RequestHandler = async ({ platform }) => {
  if (!platform?.env.WEBSOCKET_HIBERNATION_SERVER) {
    return new Response('WebSocket service not available', { status: 503 });
  }

  const id = platform.env.WEBSOCKET_HIBERNATION_SERVER.idFromName('websocket-server');
  const stub = platform.env.WEBSOCKET_HIBERNATION_SERVER.get(id);

  return stub.fetch('http://internal/websocket', {
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
      'Sec-WebSocket-Version': '13',
    },
  });
};
