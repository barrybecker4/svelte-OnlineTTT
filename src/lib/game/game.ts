export interface Player {
  id: string;
  symbol: 'X' | 'O';
  name: string;
}

export interface GameState {
  id: string;
  board: string; // 9-character string like "_X_O_X_O_"
  status:
    | 'PENDING'
    | 'ACTIVE'
    | 'X_WIN'
    | 'O_WIN'
    | 'TIE'
    | 'X_BY_RESIGN'
    | 'O_BY_RESIGN'
    | 'X_BY_TIMEOUT'
    | 'O_BY_TIMEOUT';
  player1: Player;
  player2?: Player;
  lastPlayer: 'X' | 'O' | '';
  createdAt: number;
  lastMoveAt: number;
}

export interface GameHistory {
  player1: string;
  player2: string;
  games: GameHistoryEntry[];
}

export interface GameHistoryEntry {
  gameId: string;
  status: GameState['status'];
  completedAt: number;
}
