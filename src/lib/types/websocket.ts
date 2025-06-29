// Shared types for WebSocket communication between client and server

export interface GameMessage {
  type: 'gameUpdate' | 'playerJoined' | 'gameEnded' | 'error' | 'subscribed' | 'pong';
  gameId: string;
  data: any;
  timestamp: number;
}
