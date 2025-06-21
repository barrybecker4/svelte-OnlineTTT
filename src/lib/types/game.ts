export type GameStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'X_WIN'
  | 'O_WIN'
  | 'TIE'
  | 'X_BY_RESIGN'
  | 'O_BY_RESIGN'
  | 'X_BY_TIMEOUT'
  | 'O_BY_TIMEOUT';

export type PlayerSymbol = 'X' | 'O';

export interface Player {
  id: string;
  symbol: PlayerSymbol;
  name: string;
}

export interface GameState {
  gameId: string;
  board: string; // 9-character string like "_X_O_X_O_"
  status: GameStatus;
  player1: Player;
  player2?: Player;
  lastPlayer: PlayerSymbol | '';
  createdAt: number;
  lastMoveAt: number;
  timeoutWarningAt?: number;
}

export interface MoveResult {
  status: GameStatus;
  winningPositions: number[] | null;
  boardData: string;
  nextPlayer: PlayerSymbol;
}

export interface GameHistory {
  player1: string;
  player2: string;
  totalEncounters: number;
  totalActive: number;
  player1AsX: PlayerStats;
  player2AsX: PlayerStats;
}

export interface GameHistoryEntry {
  gameId: string;
  status: GameStatus;
  completedAt: number;
}

export interface PlayerStats {
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  wins: {
    byResignation: number;
    byTimeout: number;
  };
  losses: {
    byResignation: number;
    byTimeout: number;
  };
}

export interface OpenGamesList {
  games: GameState[];
  lastUpdated: number;
}
