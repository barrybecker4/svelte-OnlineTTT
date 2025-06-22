
export interface GameCreationResponse {
  gameId: string;
  playerId: string;
  webSocketNotificationsEnabled: boolean;
  player1: string;
  player2: string | null;
  playerSymbol: 'X' | 'O';
  status: string;
}

export interface GameStateResponse {
  gameId: string;
  board: string;
  status: string;
  player1: string;
  player1Id: string;
  player2: string | null;
  player2Id: string | null;
  nextPlayer: 'X' | 'O' | null;
  lastPlayer: string;
  lastMoveAt: number;
}