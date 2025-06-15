<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import GameBoard from '$lib/components/Game/GameBoard.svelte';
  import GameStatus from '$lib/components/Game/GameStatus.svelte';
  import GameControls from '$lib/components/Game/GameControls.svelte';
  import PlayerHistory from '$lib/components/Game/PlayerHistory.svelte';
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
      console.log('Player joined:', data);
      handlePlayerJoined(data);
    });

    wsClient.onError((error: string) => {
      console.error('WebSocket error:', error);
      alert(`Connection error: ${error}`);
    });
  }

  // API calls
  async function createNewGame() {
    try {
      console.log('Creating game with playerName:', playerName);
      const response = await fetch('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName })
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const result = await response.json();

      // Update our playerId with the one returned from server
      playerId = result.playerId;
      console.log('Received playerId from server:', playerId);

      // Load the initial game state
      await loadGameState(result.gameId);

      // Subscribe to WebSocket updates for this game
      if (wsClient && gameState) {
        wsClient.subscribeToGame(gameState.gameId, playerId);
      }

      await loadGameHistory();
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
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

  // WebSocket event handlers
  function updateGameStateFromWebSocket(data: any) {
    if (!gameState || !playerId) return;

    console.log('Updating game state from WebSocket:', data);

    gameState.board = data.board;
    gameState.status = data.status;
    gameState.lastPlayer = data.lastPlayer;
    gameState.lastMoveAt = data.lastMoveAt;

    // Determine if it's my turn based on actual player ID comparison
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';
    isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';

    console.log('Turn update - My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);

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

    // Check if it's now our turn (X goes first)
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';
    isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';

    console.log('Player joined - My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);

    if (isMyTurn) {
      startGameTimer();
    }
  }

  // Game state management
  function updateGameState(data: any) {
    if (!gameState || !playerId) return;

    gameState.board = data.board;
    gameState.status = data.status;

    // Determine if it's my turn based on actual player ID comparison
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';
    isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';

    console.log('Initial turn setup - My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);

    if (isMyTurn) {
      startGameTimer();
    } else {
      stopGameTimer();
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
</style>
