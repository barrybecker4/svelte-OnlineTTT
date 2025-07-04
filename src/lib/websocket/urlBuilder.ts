/**
 * Builds a WebSocket URL for the game service
 * @param gameId - The game ID to connect to
 * @returns Complete WebSocket URL with protocol and gameId parameter
 */
export function buildWebSocketUrl(gameId?: string): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  // Check if we're running locally (localhost or 127.0.0.1)
  const isLocalDevelopment = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';

  // Use local WebSocket worker when running locally, deployed worker otherwise
  const host = isLocalDevelopment
    ? 'localhost:8787'  // Default port for wrangler dev
    : 'svelte-ttt-websocket.barrybecker4.workers.dev';

  let wsUrl = `${protocol}//${host}/websocket`;

  if (gameId) {
    wsUrl += `?gameId=${encodeURIComponent(gameId)}`;
  }

  console.log(`WebSocket URL (${isLocalDevelopment ? 'LOCAL' : 'DEPLOYED'}):`, wsUrl);
  return wsUrl;
}