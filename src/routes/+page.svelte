<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import GameBoard from '$lib/components/game/GameBoard.svelte';
  import GameStatus from '$lib/components/game/GameStatus.svelte';
  import GameControls from '$lib/components/game/GameControls.svelte';
  import PlayerHistory from '$lib/components/game/PlayerHistory.svelte';
  import GameTimer from '$lib/components/game/GameTimer.svelte';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  import type { GameState, GameHistory } from '$lib/types/game';
  import { GameManager, type GameManagerCallbacks } from '$lib/game/GameManager';

  let gameState: GameState | null = null;
  let gameHistory: GameHistory | null = null;
  let playerName: string = '';
  let playerId: string = '';
  let isMyTurn: boolean = false;
  let wsClient: WebSocketClient | null = null;
  let webSocketNotificationsEnabled: boolean = false;
  let gameManager: GameManager | null = null;

  onMount(() => {
    if (browser) {
      playerName = getPlayerName();
      initializeGameManager();
    }
  });

  onDestroy(() => {
    gameManager?.destroy();
  });

  function getPlayerName(): string {
    let playerName = localStorage.getItem('ttt-player-name') || '';
    if (!playerName) {
      playerName = prompt('Enter your name:') || `Player${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('ttt-player-name', playerName);
    }
    return playerName;
  }

  function onGameStateUpdated(newGameState: GameState | null) {
    gameState = newGameState;
  }

  function onGameHistoryUpdated(newGameHistory: GameHistory | null) {
    gameHistory = newGameHistory;
  }

  function onTurnChanged(newIsMyTurn: boolean) {
    isMyTurn = newIsMyTurn;
  }

  function onPlayerIdUpdated(newPlayerId: string) {
    playerId = newPlayerId;
  }

  function onWebSocketStatusChanged(enabled: boolean) {
    webSocketNotificationsEnabled = enabled;
  }

  function initializeGameManager(): void {
    const callbacks: GameManagerCallbacks = {
      onGameStateUpdated,
      onGameHistoryUpdated,
      onTurnChanged,
      onPlayerIdUpdated,
      onWebSocketStatusChanged
    };

    gameManager = new GameManager(callbacks);
    gameManager.initialize(playerName);
    wsClient = gameManager.getWebSocketClient();
  }

  async function handleNewGame(): Promise<void> {
    if (!gameManager) return;
    await gameManager.createNewGame();
  }

  async function handleMakeMove(position: number): Promise<void> {
    if (!gameManager) return;
    await gameManager.makeMove(position);
  }

  async function handleEndGame(reason: 'RESIGN' | 'TIMEOUT'): Promise<void> {
    if (!gameManager) return;
    await gameManager.endGame(reason);
  }

  function handleRestart(): void {
    handleNewGame();
  }

  function getOpponentName(): string {
    if (!gameState) return '';

    const isPlayer1 = gameState.player1.id === playerId;
    if (isPlayer1) {
      return gameState.player2?.name || 'Waiting for opponent...';
    } else {
      return gameState.player1.name;
    }
  }

  function getMySymbol(): string {
    if (!gameState) return 'X';
    if (gameState.status === 'PENDING') return 'X';
    if (gameState.lastPlayer === '') return 'X';
    if (!gameState.player1) {
      throw new Error("gameState did not contain player1:", gameState);
    }
    return gameState.player1?.id === playerId ? 'X' : 'O';
  }
</script>

<svelte:head>
  <title>Online Tic-Tac-Toe</title>
  <meta name="description" content="Play real-time multiplayer tic-tac-toe online" />
</svelte:head>

<div class="container mx-auto p-4 max-w-6xl">
  <h1 class="text-4xl font-bold text-center text-blue-600 mb-8">Online Tic-Tac-Toe</h1>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Game Area (Left 2/3) -->
    <div class="lg:col-span-2">
      {#if gameState}
        <GameStatus
          status={gameState.status}
          currentPlayer={getMySymbol()}
          player1Name={gameState.player1.name}
          player2Name={gameState.player2?.name || null}
          {isMyTurn}
          timeRemaining={null}
        />

        <div class="mt-6">
          <GameBoard
            board={gameState.board}
            disabled={!isMyTurn || gameState.status !== 'ACTIVE'}
            currentPlayerSymbol={getMySymbol()}
            onCellClick={position => handleMakeMove(position)}
          />
        </div>

        <div class="mt-6">
          <GameControls
              gameStatus={gameState.status}
              canQuit={gameState.status === 'ACTIVE' || gameState.status === 'PENDING'}
              isInGame={true}
              onNewGame={handleRestart}
              onQuitGame={() => handleEndGame('RESIGN')}
            />
        </div>
      {:else}
        <div class="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 class="text-2xl font-semibold mb-4">Welcome, {playerName}!</h2>
          <p class="text-gray-600 mb-6">Ready to play some tic-tac-toe?</p>
          <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            on:click={handleNewGame}
          >
            Play
          </button>
        </div>
      {/if}
    </div>

    <div class="space-y-6">
      <ConnectionStatus {wsClient} />

      {#if gameState}
        <GameTimer {isMyTurn} onTimeout={() => handleEndGame('TIMEOUT')} timerDuration={10} />
      {/if}

      {#if gameHistory}
        <PlayerHistory
          history={gameHistory}
          currentPlayerName={playerName}
          opponentName={gameState?.player1.id === playerId ? gameState.player2?.name || null : gameState?.player1.name}
        />
      {/if}
    </div>
  </div>
</div>
