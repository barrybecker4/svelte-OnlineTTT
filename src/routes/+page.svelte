<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import GameBoard from '$lib/components/game/GameBoard.svelte';
  import GameStatus from '$lib/components/game/GameStatus.svelte';
  import GameControls from '$lib/components/game/GameControls.svelte';
  import PlayerHistory from '$lib/components/game/PlayerHistory.svelte';
  import GameTimer from '$lib/components/game/GameTimer.svelte';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  import type { GameState, GameHistory } from '$lib/types/game.ts';
  import { GameWebSocketClient } from '$lib/websocket/client.ts';
  import { GameMatchingService } from '$lib/game/matching';
  import { gameAudio } from '$lib/audio/Audio';

  let gameState: GameState | null = null;
  let gameHistory: GameHistory | null = null;
  let gameMatchingService: GameMatchingService;
  let playerName: string = '';
  let playerId: string = '';
  let isMyTurn: boolean = false;
  let wsClient: GameWebSocketClient | null = null;
  let webSocketNotificationsEnabled: boolean = false;

  onMount(() => {
    if (browser) {
      playerName = getPlayerName();
      gameMatchingService = new GameMatchingService();
      wsClient = new GameWebSocketClient();
      setupWebSocketCallbacks();
    }
  });

  function getPlayerName(): string {
    let playerName = localStorage.getItem('ttt-player-name') || '';
    if (!playerName) {
        playerName = prompt('Enter your name:') || `Player${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem('ttt-player-name', playerName);
    }
    return playerName;
  }

  function setupWebSocketCallbacks() {
    if (!wsClient) return;

    wsClient.onGameUpdate((data: any) => {
      console.log('📩 Received game update:', data);
      updateGameStateFromWebSocket(data);
    });

    wsClient.onPlayerJoined((data: any) => {
      console.log('👋 Player joined notification received:', data);
      handlePlayerJoined(data);
    });
  }

  async function handleNewGame() {
    console.log('🎮 Starting new game - cleaning up state...');

    try {
      // Step 1: Disconnect WebSocket cleanly
      if (wsClient) {
        console.log('🔌 Disconnecting WebSocket...');
        wsClient.disconnect();
      }

      // Step 2: Reset ALL game-related state
      console.log('🧹 Resetting game state...');
      gameState = null;
      playerId = '';
      isMyTurn = false;
      webSocketNotificationsEnabled = false;
      gameHistory = null;

      // Step 3: Give a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Create fresh game
      console.log('🎯 Creating fresh game...');
      await createNewGame();

      console.log('✅ New game started successfully');

    } catch (error) {
      console.error('❌ Error starting new game:', error);

      // Fallback: Force complete reset
      console.log('🔄 Forcing complete state reset...');
      if (wsClient) {
        wsClient.disconnect();
      }
      gameState = null;
      playerId = '';
      isMyTurn = false;
      webSocketNotificationsEnabled = false;
      gameHistory = null;

      alert('Error starting new game. Please refresh the page if issues persist.');
    }
  }

  async function createNewGame() {
    try {
      console.log('🎯 Starting game creation for player:', playerName);

      // Use the matching service
      const result = await gameMatchingService.findOrCreateGame(playerName);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create/join game');
      }

      console.log('✅ Game join successful:', result);

      // Set player data from the service result
      playerId = result.playerId;
      webSocketNotificationsEnabled = result.webSocketNotificationsEnabled ?? false;

      // Load the full game state
      gameState = await gameMatchingService.loadGameState(result.gameId);

      if (!gameState) {
        throw new Error('Failed to load game state');
      }

      console.log('✅ Game state loaded:', gameState);
      console.log('🔧 WebSocket notifications enabled:', webSocketNotificationsEnabled);

      // Connect to WebSocket
      if (wsClient && gameState) {
        console.log('🔌 Attempting WebSocket connection for game:', gameState.gameId);
        try {
          await wsClient.connect(gameState.gameId);
          console.log('✅ WebSocket connected successfully!');
        } catch (wsError) {
          console.error('❌ WebSocket connection error:', wsError);
        }
      }

      // Set initial turn state
      if (gameState.status === 'ACTIVE') {
        const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';
        isMyTurn = mySymbol === 'X'; // X goes first
      } else {
        isMyTurn = false; // PENDING games can't make moves
      }

    } catch (error) {
      console.error('❌ Error creating game:', error);
      alert('Failed to create game. Please try again.');
    }
  }

  async function makeMove(position: number) {
    if (!gameState || !isMyTurn || gameState.status !== 'ACTIVE') {
      console.log('Cannot make move - game state:', gameState?.status, 'isMyTurn:', isMyTurn);
      return;
    }

    // Check if position is already taken
    if (gameState.board[position] !== '_') {
      console.log('Position already taken:', position);
      return;
    }

    // Optimistic update
    const originalBoard = gameState.board;
    const symbol = gameState.player1.id === playerId ? 'X' : 'O';
    const newBoard = gameState.board.split('');
    newBoard[position] = symbol;
    gameState.board = newBoard.join('');

    // Disable moves temporarily
    isMyTurn = false;

    try {
      console.log('Making move at position:', position);
      gameAudio.playMoveSound();

      const response = await fetch(`/api/game/${gameState.gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameState.gameId,
          playerId,
          cellPosition: position
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to make move: ${errorText}`);
      }

      const data = await response.json();
      console.log('Move response:', data);

      // Update game state with server response
      updateGameStateFromWebSocket(data);

    } catch (error) {
      console.error('Error making move:', error);
      // Rollback optimistic update
      gameState.board = originalBoard;
      // Re-enable moves if it was our turn
      const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';
      isMyTurn = mySymbol === 'X' ? gameState.lastPlayer === 'O' : gameState.lastPlayer === 'X';
    }
  }

  async function endGame(reason: 'RESIGN' | 'TIMEOUT') {
    if (!gameState) return;

    try {
      const response = await fetch(`/api/game/${gameState.gameId}/quit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, reason })
      });

      if (response.ok) {
        console.log(`Game ended: ${reason.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error ending game:', error);
    }
  }

  // WebSocket handlers
  function updateGameStateFromWebSocket(data: any) {
    if (!gameState || !playerId) return;

    console.log('Updating game state from WebSocket:', data);

    gameState.board = data.board;
    gameState.status = data.status;
    gameState.lastPlayer = data.lastPlayer;
    gameState.lastMoveAt = data.lastMoveAt;

    // Determine if it's my turn
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';

    if (data.status === 'PENDING') {
      isMyTurn = false;
    } else if (data.status === 'ACTIVE') {
      isMyTurn = data.nextPlayer === mySymbol;
    } else {
      isMyTurn = false; // Game is over
    }

    console.log('Turn update - My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);

    // Handle game over
    const gameOver = data.status !== 'ACTIVE' && data.status !== 'PENDING';
    if (gameOver) {
      playGameOverSound(data.status, mySymbol);
    }
  }

  function handlePlayerJoined(data: any) {
    if (!gameState) return;

    console.log('👋 Handling player joined:', data);

    // Update game state with new player info
    gameState.status = data.status;

    if (data.player2) {
      gameState.player2 = {
        id: data.player2.id,
        name: data.player2.name,
        symbol: 'O'
      };
    }

    gameState.board = data.board;
    gameState.lastPlayer = data.lastPlayer;
    gameState.lastMoveAt = data.lastMoveAt;

    // Determine turns
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';

    if (data.status === 'ACTIVE') {
      isMyTurn = data.nextPlayer === mySymbol;
      console.log('Game is now ACTIVE! My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);
    } else {
      isMyTurn = false;
    }

    // Play sound for player joining
    gameAudio.playPlayerJoined();

    console.log('✅ Player joined successfully processed');
  }

  function playGameOverSound(status: string, mySymbol: 'X' | 'O') {
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

  function getCurrentPlayerSymbol(): 'X' | 'O' {
    return gameState!.player1.id === playerId ? 'X' : 'O';
  }

  onDestroy(() => {
    if (wsClient) {
      wsClient.disconnect();
    }
  });
</script>

<div class="container mx-auto max-w-lg p-4">
  <h1 class="mb-6 text-center text-3xl font-bold">Online Tic-Tac-Toe</h1>

  {#if !gameState}
    <div class="rounded-lg bg-white p-6 shadow-md">
      <div class="text-center">
        <h2 class="mb-4 text-xl font-semibold">Ready to Play?</h2>
        <button on:click={createNewGame} class="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">
          Play
        </button>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      <GameStatus
        status={gameState.status}
        currentPlayer={getCurrentPlayerSymbol()}
        player1Name={gameState.player1.name}
        player2Name={gameState.player2?.name || null}
        {isMyTurn}
        timeRemaining={null}
      />

      <GameBoard
        board={gameState.board}
        disabled={!isMyTurn || gameState.status !== 'ACTIVE'}
        currentPlayerSymbol={getCurrentPlayerSymbol()}
        onCellClick={position => makeMove(position)}
      />

      <GameControls
        gameStatus={gameState?.status || 'PENDING'}
        canQuit={gameState && (gameState.status === 'ACTIVE' || gameState.status === 'PENDING')}
        isInGame={gameState !== null}
        onNewGame={handleNewGame}
        onQuitGame={() => endGame('RESIGN')}
      />

      <GameTimer {isMyTurn} onTimeout={() => endGame('TIMEOUT')} timerDuration={10} />
      <ConnectionStatus {wsClient} />
    </div>
  {/if}

  {#if gameHistory}
    <PlayerHistory
      history={gameHistory}
      currentPlayerName={playerName}
      opponentName={gameState?.player1.id === playerId ? gameState.player2?.name || null : gameState?.player1.name}
    />
  {/if}
</div>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }

  @media (max-width: 768px) {
    .container {
      padding: 10px;
    }
  }
</style>
