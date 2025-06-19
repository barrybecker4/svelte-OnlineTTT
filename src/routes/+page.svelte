<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import GameBoard from '$lib/components/game/GameBoard.svelte';
  import GameStatus from '$lib/components/game/GameStatus.svelte';
  import GameControls from '$lib/components/game/GameControls.svelte';
  import PlayerHistory from '$lib/components/game/PlayerHistory.svelte';
  import GameTimer from '$lib/components/GameTimer.svelte';
  import GamePoller from '$lib/components/GamePoller.svelte';
  import type { GameState, GameHistory } from '$lib/types/game.ts';
  import { getWebSocketClient } from '$lib/websocket/client.ts';

  // Game state
  let gameState: GameState | null = null;
  let gameHistory: GameHistory | null = null;
  let playerName: string = '';
  let playerId: string = '';
  let isMyTurn: boolean = false;
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

      // Initialize WebSocket client but don't connect yet
      wsClient = getWebSocketClient();
      setupWebSocketCallbacks();
    }
  });

  function setupWebSocketCallbacks() {
    wsClient.onGameUpdate((data: any) => {
      console.log('📩 Received game update:', data);
      updateGameStateFromWebSocket(data);
    });

    wsClient.onPlayerJoined((data: any) => {
      console.log('👋 Player joined notification received:', data);
      handlePlayerJoined(data);
    });

    wsClient.onError((error: string) => {
      console.error('❌ WebSocket error:', error);
      alert(`Connection error: ${error}`);
    });
  }

  async function createNewGame() {
    try {
      console.log('Creating game with playerName:', playerName);

      // Create the game via HTTP API first
      const response = await fetch('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName })
      });

      if (!response.ok) {
        throw new Error(`Failed to create game: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Game creation response:', data);

      // Set our player ID
      playerId = data.playerId;
      console.log('Set playerId to:', playerId);

      // Load the full game state
      console.log('Loading game state for gameId:', data.gameId);
      await loadGameState(data.gameId);

      console.log('Final gameState after loading:', gameState);

      // Connect to WebSocket with the specific gameId
      if (wsClient && gameState) {
        console.log('Attempting WebSocket connection for game:', gameState.gameId);
        try {
          // Connect directly to the deployed WebSocket worker
          await wsClient.connect(gameState.gameId);

          // Give it a moment to connect
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (wsClient.isConnected()) {
            console.log('✅ WebSocket connected successfully! Subscribing to updates...');
            wsClient.subscribeToGame(gameState.gameId, playerId);

            // Note: GamePoller will start automatically when gameState becomes non-null
          } else {
            console.warn('❌ WebSocket connection failed');
          }
        } catch (wsError) {
          console.error('WebSocket connection error:', wsError);
        }
      }

    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    }
  }

  onDestroy(() => {
    if (wsClient) {
      if (gameState) {
        wsClient.unsubscribeFromGame(gameState.gameId);
      }
      wsClient.disconnect();
    }
    // Note: GameTimer and GamePoller components will handle their own cleanup
  });

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

      const wasMyTurn = isMyTurn;
      const previousBoard = gameState?.board;

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

      console.log('Game state loaded:', gameState);

      // Determine current player and if it's my turn
      const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';

      // For PENDING games, only player 1 (X) should be "ready" but not actively playing
      if (data.status === 'PENDING') {
        isMyTurn = false; // No moves can be made in PENDING state
        console.log('Game is PENDING - waiting for second player');
      } else {
        isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';
        console.log('Turn setup - My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);
      }

      // Note: Timer start/stop is now handled by GameTimer component via isMyTurn prop

    } catch (error) {
      console.error('Error loading game state:', error);
    }
  }

  async function makeMove(position: number) {
    if (!gameState || !isMyTurn || gameState.status !== 'ACTIVE') {
      console.log('Cannot make move - game state:', gameState?.status, 'isMyTurn:', isMyTurn);
      return;
    }

    // Check if this position is already taken
    if (gameState.board[position] !== '_') {
      console.log('Position already taken:', position);
      return;
    }

    // Prevent duplicate moves by temporarily disabling
    const wasMyTurn = isMyTurn;
    isMyTurn = false; // This will stop the GameTimer via reactive logic

    try {
      console.log('Making move at position:', position);

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

      // Update local game state immediately for better UX
      updateGameStateFromWebSocket(data);

    } catch (error) {
      console.error('Error making move:', error);

      // Restore turn state if move failed
      isMyTurn = wasMyTurn; // This will restart the GameTimer if needed
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
        console.log('Game quit successfully');
      }
    } catch (error) {
      console.error('Error quitting game:', error);
    }
  }

  async function loadGameHistory() {
    // This would call a history API endpoint when implemented
    gameHistory = null;
  }

  // WebSocket handlers
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

    // Note: Timer management is now handled by GameTimer component

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

    // Note: Timer start is now handled by GameTimer component via isMyTurn prop changes
  }

  // Utility functions
  function getCurrentPlayerSymbol(): 'X' | 'O' | null {
    if (!gameState || gameState.status !== 'ACTIVE' || !playerId) return null;
    return gameState.player1.id === playerId ? 'X' : 'O';
  }

  function isGameActive(): boolean {
    return gameState?.status === 'ACTIVE';
  }

  function canMakeMove(): boolean {
    const result = isGameActive() && isMyTurn;
    console.log('canMakeMove():', {
      isGameActive: isGameActive(),
      isMyTurn,
      gameStatus: gameState?.status,
      playerId,
      result
    });
    return result;
  }
</script>

<div class="container mx-auto max-w-lg p-4">
  <h1 class="mb-6 text-center text-3xl font-bold">Online Tic-Tac-Toe</h1>

  {#if !gameState}
  <div class="rounded-lg bg-white p-6 shadow-md">
    <div class="text-center">
      <h2 class="mb-4 text-xl font-semibold">Ready to Play?</h2>
      <button
        on:click={createNewGame}
        class="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
      >
        Play
      </button>
    </div>
  </div>
{:else}
  <div class="space-y-4">
    <!-- GameTimer Component - replaces timer variables and functions -->
    <GameTimer
      {isMyTurn}
      onTimeout={quitGame}
      timerDuration={10}
    />

    <!-- GamePoller Component - replaces polling variables and functions -->
    <GamePoller
      gameId={gameState.gameId}
      gameStatus={gameState.status}
      onGameUpdate={loadGameState}
      enabled={true}
    />

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
      on:cellClick={(e) => makeMove(e.detail.position)}
    />

    <GameControls
      gameStatus={gameState?.status || 'PENDING'}
      canQuit={gameState && (gameState.status === 'ACTIVE' || gameState.status === 'PENDING')}
      isInGame={gameState !== null}
      on:newGame={() => { gameState = null; }}
      on:quitGame={quitGame}
    />
  </div>
{/if}

{#if gameHistory}
  <PlayerHistory
    {gameHistory}
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

  .welcome {
    margin: 2rem 0;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
    color: #495057;
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