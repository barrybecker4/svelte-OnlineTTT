import type { GameState, GameHistory } from '$lib/types/game';
import { GameWebSocketClient } from '$lib/websocket/client';
import { GameMatchingService } from '$lib/game/matching';
import { gameAudio } from '$lib/audio/Audio';

export interface GameManagerCallbacks {
  onGameStateUpdated: (gameState: GameState | null) => void;
  onGameHistoryUpdated: (gameHistory: GameHistory) => void;
  onTurnChanged: (isMyTurn: boolean) => void;
  onPlayerIdUpdated: (playerId: string) => void;
  onWebSocketStatusChanged: (enabled: boolean) => void;
}

export class GameManager {
  private gameState: GameState | null = null;
  private gameHistory: GameHistory | null = null;
  private gameMatchingService: GameMatchingService;
  private playerName: string = '';
  private playerId: string = '';
  private isMyTurn: boolean = false;
  private wsClient: GameWebSocketClient | null = null;
  private webSocketNotificationsEnabled: boolean = false;
  private callbacks: GameManagerCallbacks;

  constructor(callbacks: GameManagerCallbacks) {
    this.callbacks = callbacks;
    this.gameMatchingService = new GameMatchingService();
    this.wsClient = new GameWebSocketClient();
  }

  public initialize(playerName: string): void {
    this.playerName = playerName;
    this.setupWebSocketCallbacks();
  }

  public getGameState(): GameState | null {
    return this.gameState;
  }

  public getGameHistory(): GameHistory | null {
    return this.gameHistory;
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  public getPlayerName(): string {
    return this.playerName;
  }

  public getIsMyTurn(): boolean {
    return this.isMyTurn;
  }

  public getWebSocketClient(): GameWebSocketClient | null {
    return this.wsClient;
  }

  public getWebSocketNotificationsEnabled(): boolean {
    return this.webSocketNotificationsEnabled;
  }

  public async createNewGame(): Promise<void> {
    try {
      console.log('🎯 createNewGame() called');
      console.log('  Current gameState:', this.gameState?.gameId, 'status:', this.gameState?.status);
      console.log('  Current playerId:', this.playerId);

      // Always disconnect WebSocket first to prevent conflicts
      this.disconnectWebSocket();

      // Only quit if there's an active game that's not already completed
      if (this.gameState && this.playerId && this.isGameActive(this.gameState)) {
        console.log('🚪 Quitting active game before creating new one...');
        const quitResponse = await this.quitCurrentGame(this.gameState, this.playerId);
        console.log('🚪 Quit response status:', quitResponse.status);
      } else if (this.gameState) {
        console.log('🔄 Game already completed, skipping quit step');
      } else {
        console.log('🆕 No existing game to quit');
      }

      // Clear state after any quit operation
      this.clearGameState();
      console.log('🧹 Game state cleared');

      // Join/create game using the matching service
      console.log('🎯 Requesting game from matching service...');
      const gameJoinResult = await this.gameMatchingService.findOrCreateGame(this.playerName);

      if (!gameJoinResult.success) {
        throw new Error(gameJoinResult.error || 'Failed to create/join game');
      }

      // Set player data from the service result
      this.playerId = gameJoinResult.playerId;
      this.webSocketNotificationsEnabled = gameJoinResult.webSocketNotificationsEnabled ?? false;
      this.callbacks.onPlayerIdUpdated(this.playerId);
      this.callbacks.onWebSocketStatusChanged(this.webSocketNotificationsEnabled);

      console.log('🔄 Loading game state for gameId:', gameJoinResult.gameId);
      const loadedGameState = await this.gameMatchingService.loadGameState(gameJoinResult.gameId);
      if (!loadedGameState) {
        throw new Error('Failed to load game state');
      }

      this.gameState = loadedGameState;
      this.callbacks.onGameStateUpdated(this.gameState);
      await this.loadGameHistory();

      // Try to connect WebSocket
      if (this.wsClient && this.gameState) {
        console.log('🔌 Connecting WebSocket for game:', this.gameState.gameId);
        try {
          await this.wsClient.connect(this.gameState.gameId);
          this.webSocketNotificationsEnabled = true;
          this.callbacks.onWebSocketStatusChanged(true);
          console.log('✅ WebSocket connected successfully');
        } catch (wsError) {
          console.error('❌ WebSocket connection error:', wsError);
        }
      }

      // Set turn state
      if (this.gameState.status === 'ACTIVE') {
        const mySymbol = this.getMySymbol();
        this.isMyTurn = mySymbol === 'X'; // X goes first
        console.log('🎮 Game is ACTIVE, my symbol:', mySymbol, 'isMyTurn:', this.isMyTurn);
      } else {
        this.isMyTurn = false; // PENDING games can't make moves
        console.log('⏳ Game is PENDING, waiting for second player');
      }
      this.callbacks.onTurnChanged(this.isMyTurn);

    } catch (error) {
      console.error('❌ Error creating game:', error);
      throw error;
    }
  }


  public async makeMove(position: number): Promise<void> {
    if (!this.gameState || !this.isMyTurn || this.gameState.status !== 'ACTIVE') {
      console.log('Cannot make move - game state:', this.gameState?.status, 'isMyTurn:', this.isMyTurn);
      return;
    }

    // Check if position is already taken
    if (this.gameState.board[position] !== '_') {
      console.log('Position already taken:', position);
      return;
    }

    // Optimistic update
    const originalBoard = this.gameState.board;
    const symbol = this.getMySymbol();
    const newBoard = this.gameState.board.split('');
    newBoard[position] = symbol;
    this.gameState.board = newBoard.join('');
    this.callbacks.onGameStateUpdated(this.gameState);

    // Disable moves temporarily to prevent duplicate moves
    this.isMyTurn = false;
    this.callbacks.onTurnChanged(this.isMyTurn);

    try {
      console.log('Making move at position:', position);
      gameAudio.playMoveSound();

      const response = await fetch(`/api/game/${this.gameState.gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameState.gameId,
          playerId: this.playerId,
          cellPosition: position
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to make move: ${errorText}`);
      }

      const gameState = await response.json() as GameState;
      console.log('Move response:', gameState);

      this.updateGameStateFromWebSocket(gameState);

    } catch (error) {
      console.error('Error making move:', error);
      this.gameState.board = originalBoard; // Rollback

      // Re-enable moves if it was our turn
      const mySymbol = this.getMySymbol();
      this.isMyTurn = mySymbol === 'X' ?
        this.gameState.board.split('').filter(cell => cell !== '_').length % 2 === 0 :
        this.gameState.board.split('').filter(cell => cell !== '_').length % 2 === 1;

      this.callbacks.onTurnChanged(this.isMyTurn);
      this.callbacks.onGameStateUpdated(this.gameState);
    }
  }

  public async endGame(reason: 'RESIGN' | 'TIMEOUT'): Promise<void> {
    if (!this.gameState) return;

    try {
      console.log('🏁 Ending game...');
      const response =
        await this.quitCurrentGame(this.gameState, this.playerId, reason);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to end game: ${errorText}`);
      }

      const data = await response.json() as GameState;
      console.log('Game ended:', data);

      if (response.ok) {
        this.gameState = {
          ...this.gameState,
          status: data.status,
          lastPlayer: data.lastPlayer,
          lastMoveAt: data.lastMoveAt
        };
        console.log(`Game ended: ${reason.toLowerCase()}`);
      }
      this.disconnectWebSocket();

    } catch (error) {
      console.error('Error ending game:', error);
      throw error;
    }
  }

  // private isGameActive(gameState: GameState): boolean {
  //   return gameState.status === 'ACTIVE' || gameState.status === 'PENDING';
  // }
  private isGameActive(gameState: GameState): boolean {
    // Only consider games that are still in progress
    const activeStatuses = ['ACTIVE', 'PENDING'];
    const isActive = activeStatuses.includes(gameState.status);
    console.log(`🔍 isGameActive check: status=${gameState.status}, isActive=${isActive}`);
    return isActive;
  }

  private async quitCurrentGame(gameState: GameState, playerId: string, reason = 'RESIGN'): Promise<Response> {
    console.log('Quit:', gameState.gameId);
    return fetch(`/api/game/${gameState.gameId}/quit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, reason })
    });
  }

  public destroy(): void {
    if (this.wsClient && this.webSocketNotificationsEnabled) {
      this.wsClient.disconnect();
      this.webSocketNotificationsEnabled = false;
    }
  }

  private getMySymbol(): string {
    return this.gameState?.player1?.id === this.playerId ? 'X' : 'O';
  }

  private updateGameStateFromWebSocket(gameState: GameState): void {
    if (!gameState) return;

    console.log('🔄 Processing game update:', gameState);

    // Update game state
    this.gameState = gameState;
    this.callbacks.onGameStateUpdated(this.gameState);

    // Update turn state
    if (this.gameState.status === 'ACTIVE') {
      const mySymbol = this.getMySymbol();
      const moveCount = this.gameState.board.split('').filter(cell => cell !== '_').length;

      if (mySymbol === 'X') {
        this.isMyTurn = moveCount % 2 === 0; // X goes on even move counts (0, 2, 4...)
      } else {
        this.isMyTurn = moveCount % 2 === 1; // O goes on odd move counts (1, 3, 5...)
      }
    } else {
      this.isMyTurn = false;
    }
    this.callbacks.onTurnChanged(this.isMyTurn);

    // Check if game ended and play sound
    const gameOver = gameState.status !== 'ACTIVE' && gameState.status !== 'PENDING';
    if (gameOver) {
      this.loadGameHistory();
      this.playGameOverSound();
    }

    // Connect WebSocket if not already connected and game is active
    if (this.gameState.status === 'ACTIVE' && this.gameState.player2 && !this.webSocketNotificationsEnabled) {
      this.connectWebSocketForActiveGame();
    }
  }

  private async handlePlayerJoined(data: { gameId: string; player2: { name: string; id: string } }) {
    console.log('👋 Handling player joined:', data);

    if (this.gameState && this.gameState.gameId === data.gameId) {
      // Update player2 info with proper Player interface
      this.gameState.player2 = {
        id: data.player2.id,
        name: data.player2.name,
        symbol: 'O' // Player2 is always O
      };

      this.gameState.status = 'ACTIVE';
      this.callbacks.onGameStateUpdated(this.gameState);

      // Set turn state for active game
      const mySymbol = this.getMySymbol();
      this.isMyTurn = mySymbol === 'X'; // X goes first
      this.callbacks.onTurnChanged(this.isMyTurn);

      this.loadGameHistory();
    }
  }

  private setupWebSocketCallbacks(): void {
    if (!this.wsClient) return;

    this.wsClient.onGameUpdate((data: GameState) => {
      console.log('📩 Received game update:', data);
      this.updateGameStateFromWebSocket(data);
    });

    this.wsClient.onPlayerJoined((data: { gameId: string; player2: { name: string; id: string } }) => {
      console.log('👋 Player joined notification received:', data);
      this.handlePlayerJoined(data);
    });
  }

  private async connectWebSocketForActiveGame(): Promise<void> {
    if (!this.gameState || !this.wsClient) return;

    try {
      console.log('🔌 Connecting WebSocket for newly active game...');
      await this.wsClient.connect(this.gameState.gameId);
      this.webSocketNotificationsEnabled = true;
      this.callbacks.onWebSocketStatusChanged(true);
      console.log('✅ WebSocket connected for active game');
    } catch (wsError) {
      console.error('❌ WebSocket connection error:', wsError);
    }
  }

  private async loadGameHistory(): Promise<void> {
    if (!this.gameState || !this.gameState.player1 || !this.gameState.player2) {
      console.log('📚 Skipping history load - need both players');
      return;
    }

    try {
      console.log('📚 Loading game history...');
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1: this.gameState.player1.name,
          player2: this.gameState.player2.name
        })
      });

      if (response.ok) {
        const historyData = await response.json() as GameHistory;
        console.log('📖 Game history loaded:', historyData);
        this.gameHistory = historyData;
        this.callbacks.onGameHistoryUpdated(this.gameHistory);
      } else {
        console.warn('⚠️ Could not load game history:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error loading game history:', error);
    }
  }

  private playGameOverSound(): void {
    if (!this.gameState) return;

    const status = this.gameState.status;
    const mySymbol = this.getMySymbol();

    if (status === 'TIE') {
      gameAudio.playGameTie();
    } else if (status.endsWith('_WIN') || status.endsWith('_BY_RESIGN') || status.endsWith('_BY_TIMEOUT')) {
      const winnerSymbol = status.startsWith('X') ? 'X' : 'O';
      if (winnerSymbol === mySymbol) {
        gameAudio.playGameWon();
      } else {
        gameAudio.playGameLost();
      }
    }
  }

  private disconnectWebSocket(): void {
    if (this.wsClient && this.webSocketNotificationsEnabled) {
      try {
        console.log('🔌 Disconnecting WebSocket...');
        this.wsClient.disconnect();
        this.webSocketNotificationsEnabled = false;
        this.callbacks.onWebSocketStatusChanged(false);
        console.log('🔌 WebSocket disconnected successfully');
      } catch (wsError) {
        console.error('❌ WebSocket disconnect error:', wsError);
      }
    } else {
      console.log('🔌 No active WebSocket to disconnect');
    }
  }

  private clearGameState(): void {
    console.log('🧹 Clearing game state...');
    console.log('  Previous gameState:', this.gameState?.gameId);
    console.log('  Previous playerId:', this.playerId);

    this.gameState = null;
    this.playerId = '';
    this.isMyTurn = false;
    this.callbacks.onGameStateUpdated(this.gameState);
    this.callbacks.onTurnChanged(this.isMyTurn);
    this.callbacks.onPlayerIdUpdated(this.playerId);

    console.log('🧹 Game state cleared successfully');
  }
}
