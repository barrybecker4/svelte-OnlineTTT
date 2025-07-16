<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import GameBoard from '$lib/components/game/GameBoard.svelte';
  import GameStatus from '$lib/components/game/GameStatus.svelte';
  import GameControls from '$lib/components/game/GameControls.svelte';
  import PlayerHistory from '$lib/components/game/PlayerHistory.svelte';
  import GameTimer from '$lib/components/game/GameTimer.svelte';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  import { PlayerHistoryStats } from '$lib/game/PlayerHistoryStats.ts';
  import type { GameState, GameHistory } from '$lib/types/game';
  import { GameManager, type GameManagerCallbacks } from '$lib/game/GameManager';

  let gameState: GameState | null = null;
  let formattedHistory: string | null = null;
  let playerName: string = '';
  let playerId: string = '';
  let isMyTurn: boolean = false;
  let wsClient: WebSocketClient | null = null;
  let webSocketNotificationsEnabled: boolean = false;
  let gameManager: GameManager | null = null;
  let cleanupBrowserHandlers: (() => void) | null = null;

  onMount(() => {
    if (browser) {
      playerName = getPlayerName();
      initializeGameManager();
      //cleanupBrowserHandlers = setupBrowserQuitHandler();
    }
  });

  onDestroy(() => {
    gameManager?.destroy();
    cleanupBrowserHandlers?.();
  });

  function setupBrowserQuitHandler(): () => void {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only quit if we have an active game
      if (gameManager && gameState && playerId) {
        const isGameActive = gameState.status === 'ACTIVE' || gameState.status === 'PENDING';

        if (isGameActive) {
          console.log('🚪 Browser closing/refreshing - sending quit request');

          // Send quit request synchronously before the page unloads
          const quitData = JSON.stringify({
            playerId: playerId,
            reason: 'RESIGN'
          });

          try {
            // sendBeacon is more reliable during page unload than fetch
            const success = navigator.sendBeacon(`/api/game/${gameState.gameId}/quit`, quitData);
            console.log('📡 Quit beacon sent:', success);
          } catch (error) {
            console.error('❌ Beacon failed, trying fetch:', error);
            // Fallback to synchronous fetch if sendBeacon fails
            fetch(`/api/game/${gameState.gameId}/quit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: quitData,
              keepalive: true // Keep request alive during page unload
            }).catch(err => {
              console.error('❌ Failed to send quit request:', err);
            });
          }
        }
      }
    };

    const handleUnload = () => {
      if (gameManager && gameState && playerId) {
        const isGameActive = gameState.status === 'ACTIVE' || gameState.status === 'PENDING';

        if (isGameActive) {
          console.log('🚪 Page unloading - sending quit request');
          const quitData = JSON.stringify({
            playerId: playerId,
            reason: 'RESIGN'
          });

          // Use sendBeacon for unload event
          navigator.sendBeacon(`/api/game/${gameState.gameId}/quit`, quitData);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }

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
    const opponentName = gameState?.player1.id === playerId
      ? gameState.player2?.name || null
      : gameState?.player1.name;
    formattedHistory =
      new PlayerHistoryStats(newGameHistory, playerName, opponentName).formattedHistory;
  }

  function onTurnChanged(newIsMyTurn: boolean) {
    isMyTurn = newIsMyTurn;
  }

  function onPlayerIdUpdated(newPlayerId: string) {
    playerId = newPlayerId;
  }

  function onWebSocketStatusChanged(enabled: boolean) {
    webSocketNotificationsEnabled = enabled;
    wsClient = gameManager?.getWebSocketClient() || null;
  }

  function initializeGameManager() {
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
    await gameManager.createNewGame();
  }

  async function handleMakeMove(position: number): Promise<void> {
    await gameManager.makeMove(position);
  }

  async function handleEndGame(reason: 'RESIGN' | 'TIMEOUT'): Promise<void> {
    await gameManager.endGame(reason);
  }

  function handleRestart(): void {
    gameManager.createNewGame();
  }

  function getMySymbol(): string {
    if (!gameState || gameState.status === 'PENDING' || gameState.lastPlayer === '') {
      return 'X';
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

      {#if formattedHistory}
        <PlayerHistory
          formattedHistory={formattedHistory}
        />
      {/if}
    </div>
  </div>
</div>
