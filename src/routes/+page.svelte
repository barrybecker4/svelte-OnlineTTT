<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import GameBoard from '$lib/components/game/GameBoard.svelte';
  import GameStatus from '$lib/components/game/GameStatus.svelte';
  import GameControls from '$lib/components/game/GameControls.svelte';
  import PlayerHistory from '$lib/components/game/PlayerHistory.svelte';
  import type { GameState, GameHistory } from '$lib/types/game.ts';
  import { getWebSocketClient } from '$lib/websocket/client.ts';

  // Game state
  let gameState: GameState | null = null;
  let gameHistory: GameHistory | null = null;
  let playerName: string = '';
  let playerId: string = '';
  let isMyTurn: boolean = false;
  let timeRemaining: number | null = null;
  let gameTimer: number | null = null;
  let wsClient: any = null;

  // Game lifecycle
  onMount(() => {
    if (browser) {
      // Get or create player name
      playerName = localStorage.getItem('ttt-player-name') || '';
      if (!playerName) {
        playerName = prompt('Enter your name:') || `Player${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem('ttt-player-name', playerName);
      }

      // Initialize WebSocket client
      wsClient = getWebSocketClient();
      setupWebSocketCallbacks();
      wsClient.connect();
    }
  });

  onDestroy(() => {
    if (wsClient) {
      if (gameState) {
        wsClient.unsubscribeFromGame(gameState.gameId);
      }
      wsClient.disconnect();
    }
    stopGameTimer();
  });

  function setupWebSocketCallbacks() {
    wsClient.onGameUpdate((data: any) => {
      console.log('Received game update:', data);
      updateGameStateFromWebSocket(data);
    });

    wsClient.onPlayerJoined((data: any) => {
      console.log('Player joined notification received:', data);
      handlePlayerJoined(data);
    });

    wsClient.onError((error: string) => {
      console.error('WebSocket error:', error);
      alert(`Connection error: ${error}`);
    });
  }

  async function checkWebSocketAvailability() {
    try {
      const response = await fetch('/api/websocket', {
        method: 'HEAD'  // Just check if endpoint exists
      });
      return response.status !== 503;
    } catch (error) {
      return false;
    }
  }

  // Modify your createNewGame function to include this check:
  async function createNewGame() {
    try {
      console.log('Creating game with playerName:', playerName);

      // Check if we're in local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      console.log('Environment: ', isLocalDev ? 'Local Development' : 'Production');

      // Check if WebSocket service is actually available
      const wsAvailable = !isLocalDev && await checkWebSocketAvailability();
      console.log('WebSocket service available:', wsAvailable);

      let useWebSocket = wsAvailable && wsClient;

      if (useWebSocket) {
        console.log('Checking WebSocket connection...');
        try {
          if (!wsClient.isConnected()) {
            console.log('WebSocket not connected, attempting to connect...');
            await wsClient.connect();
            // Give it a moment to connect
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          if (!wsClient.isConnected()) {
            console.warn('WebSocket connection failed, continuing without WebSocket');
            useWebSocket = false;
          }
        } catch (wsError) {
          console.warn('WebSocket error, continuing without WebSocket:', wsError);
          useWebSocket = false;
        }
      } else {
        console.log('Skipping WebSocket (not available or local development)');
      }

      // Rest of your function remains the same...
    } catch (error) {
      // Error handling...
    }
  }

  async function loadGameState(gameId: string) {
    try {
      const response = await fetch(`/api/game/${gameId}`);
      if (!response.ok) throw new Error('Failed to load game');

      const data = await response.json();

      // If we don't have a playerId yet, try to determine it based on our player name
      if (!playerId && data.player1 === playerName) {
        playerId = data.player1Id;
        console.log('Set playerId to player1 ID:', playerId);
      } else if (!playerId && data.player2 === playerName) {
        playerId = data.player2Id;
        console.log('Set playerId to player2 ID:', playerId);
      }

      // Create the GameState object with correct player IDs from the server
      gameState = {
        gameId: data.gameId,
        board: data.board,
        status: data.status,
        player1: {
          id: data.player1Id,
          symbol: 'X',
          name: data.player1
        },
        player2: data.player2 ? {
          id: data.player2Id,
          symbol: 'O',
          name: data.player2
        } : undefined,
        lastPlayer: data.lastPlayer || '',
        createdAt: Date.now(),
        lastMoveAt: data.lastMoveAt
      };

      console.log('Game state loaded. My playerId:', playerId, 'My name:', playerName);
      updateGameState(data);
    } catch (error) {
      console.error('Error loading game:', error);
    }
  }

  async function makeMove(position: number) {
    if (!gameState || !isMyTurn) return;

    try {
      console.log('Making move with playerId:', playerId, 'position:', position);
      const response = await fetch(`/api/game/${gameState.gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, cellPosition: position })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Invalid move');
        return;
      }

      // Note: We don't need to update the game state here anymore
      // The WebSocket will send us the update automatically
      console.log('Move submitted successfully, waiting for WebSocket update...');
    } catch (error) {
      console.error('Error making move:', error);
      alert('Failed to make move. Please try again.');
    }
  }

  async function quitGame() {
    if (!gameState) return;

    try {
      const response = await fetch(`/api/game/${gameState.gameId}/quit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, reason: 'RESIGN' })
      });

      if (response.ok) {
        // WebSocket will notify us of the game state change
        stopGameTimer();
      }
    } catch (error) {
      console.error('Error quitting game:', error);
    }
  }

  async function loadGameHistory() {
    // This would call a history API endpoint when implemented
    gameHistory = null;
  }

  // Game state management
  function updateGameState(data: any) {
    if (!gameState || !playerId) return;

    gameState.board = data.board;
    gameState.status = data.status;

    // Determine if it's my turn based on actual player ID comparison
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';

    // For PENDING games, only player 1 (X) should be "ready" but not actively playing
    if (data.status === 'PENDING') {
      isMyTurn = false; // No moves can be made in PENDING state
      console.log('Game is PENDING - waiting for second player');
    } else {
      isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';
      console.log('Turn setup - My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);
    }

    if (isMyTurn) {
      startGameTimer();
    } else {
      stopGameTimer();
    }
  }

  // Also update the WebSocket handlers
  function updateGameStateFromWebSocket(data: any) {
    if (!gameState || !playerId) return;

    console.log('Updating game state from WebSocket:', data);

    gameState.board = data.board;
    gameState.status = data.status;
    gameState.lastPlayer = data.lastPlayer;
    gameState.lastMoveAt = data.lastMoveAt;

    // Determine if it's my turn based on actual player ID comparison
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';

    // Handle PENDING vs ACTIVE states properly
    if (data.status === 'PENDING') {
      isMyTurn = false; // Can't make moves in PENDING state
      console.log('WebSocket update - Game still PENDING');
    } else {
      isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';
      console.log('WebSocket turn update - My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);
    }

    if (isMyTurn) {
      startGameTimer();
    } else {
      stopGameTimer();
    }

    // If game ended, load history
    if (data.status !== 'ACTIVE' && data.status !== 'PENDING') {
      loadGameHistory();
    }
  }

  function handlePlayerJoined(data: any) {
    if (!gameState) return;

    console.log('Handling player joined:', data);

    // Update game state with new player info
    gameState.status = data.status;
    gameState.player2 = data.player2 ? {
      id: data.player2Id,
      symbol: 'O',
      name: data.player2
    } : undefined;
    gameState.lastPlayer = data.lastPlayer;
    gameState.lastMoveAt = data.lastMoveAt;

    // Now the game should be ACTIVE and X goes first
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';
    isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';

    console.log('Player joined - Game status:', data.status, 'My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);

    if (isMyTurn) {
      startGameTimer();
    }
  }

  function startGameTimer() {
    stopGameTimer();
    timeRemaining = 10; // 10 second timer

    gameTimer = setInterval(() => {
      if (timeRemaining !== null) {
        timeRemaining--;
        if (timeRemaining <= 0) {
          stopGameTimer();
          // Auto-quit on timeout
          quitGame();
        }
      }
    }, 1000);
  }

  function stopGameTimer() {
    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
    timeRemaining = null;
  }

  // Utility functions
  function getCurrentPlayerSymbol(): 'X' | 'O' | null {
    if (!gameState || gameState.status !== 'ACTIVE' || !playerId) return null;
    return gameState.player1.id === playerId ? 'X' : 'O';
  }

  function getOpponentName(): string | null {
    if (!gameState || !playerId) return null;
    return gameState.player1.id === playerId ? gameState.player2?.name || null : gameState.player1.name;
  }

  // Reactive statements
  $: canQuit = gameState && (gameState.status === 'ACTIVE' || gameState.status === 'PENDING');
  $: isInGame = gameState !== null;
</script>

<svelte:head>
  <title>Online Tic-Tac-Toe</title>
</svelte:head>

<main class="container">
  <header>
    <h1>Online Tic-Tac-Toe</h1>
    {#if playerName}
      <p class="player-info">Playing as: <strong>{playerName}</strong></p>
    {/if}
  </header>

  {#if gameState}
    <GameStatus
      status={gameState.status}
      currentPlayer={getCurrentPlayerSymbol()}
      player1Name={gameState.player1.name}
      player2Name={gameState.player2?.name || null}
      {isMyTurn}
      {timeRemaining}
    />

    <!-- ADD THIS REFRESH BUTTON SECTION -->
    {#if gameState.status === 'PENDING'}
      <div class="pending-refresh">
        <p>Waiting for opponent to join...</p>
        <button class="refresh-btn" on:click={() => location.reload()}>
          🔄 Check for opponent
        </button>
        <p class="help-text">Click refresh after your friend joins!</p>
      </div>
    {/if}

    <GameBoard
      board={gameState.board}
      disabled={!isMyTurn || gameState.status !== 'ACTIVE'}
      currentPlayerSymbol={getCurrentPlayerSymbol()}
      on:cellClick={(e) => makeMove(e.detail.position)}
    />

    <PlayerHistory {gameHistory} currentPlayerName={playerName} opponentName={getOpponentName()} />
  {:else}
    <div class="welcome">
      <p>Welcome to Online Tic-Tac-Toe!</p>
      <p>Click "Play" to find an opponent or create a new game.</p>
    </div>
  {/if}

  <GameControls
    gameStatus={gameState?.status || 'PENDING'}
    {canQuit}
    {isInGame}
    on:newGame={createNewGame}
    on:quitGame={quitGame}
  />
</main>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }

  header h1 {
    color: #005588;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .player-info {
    color: #666;
    margin-bottom: 2rem;
  }

  .player-info strong {
    color: #005588;
  }

  .welcome {
    margin: 2rem 0;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
    color: #495057;
  }

  .welcome p {
    margin: 0.5rem 0;
  }

  @media (max-width: 768px) {
    .container {
      padding: 10px;
    }

    header h1 {
      font-size: 2rem;
    }
  }

  .pending-refresh {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin: 16px 0;
  }

  .refresh-btn {
    background: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 1em;
    margin: 8px 0;
    transition: background-color 0.2s;
  }

  .refresh-btn:hover {
    background: #0056b3;
  }

  .help-text {
    font-size: 0.9em;
    color: #6c757d;
    margin: 8px 0 0 0;
  }
</style>
