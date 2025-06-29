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

  // Always use the deployed WebSocket worker for simplicity
  const host = 'svelte-ttt-websocket.barrybecker4.workers.dev';

  let wsUrl = `${protocol}//${host}/websocket`;

  if (gameId) {
    wsUrl += `?gameId=${encodeURIComponent(gameId)}`;
  }

  console.log('WebSocket URL:', wsUrl);
  return wsUrl;
}
