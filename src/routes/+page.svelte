<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import GameBoard from '$lib/components/game/GameBoard.svelte';
  import GameStatus from '$lib/components/game/GameStatus.svelte';
  import GameControls from '$lib/components/game/GameControls.svelte';
  import PlayerHistory from '$lib/components/game/PlayerHistory.svelte';
  import GameTimer from '$lib/components/game/GameTimer.svelte';
  import GamePoller from '$lib/components/game/GamePoller.svelte';
  import type { GameStatus as GameStatusType,GameState, GameHistory, PlayerSymbol } from '$lib/types/game.ts';
  import { getWebSocketClient } from '$lib/websocket/client.ts';
  import { gameAudio } from '$lib/audio/Audio';

  // Game state
  let gameState: GameState | null = null;
  let gameHistory: GameHistory | null = null;
  let playerName: string = '';
  let playerId: string = '';
  let isMyTurn: boolean = false;
  let wsClient: any = null;
  let wsWorking: boolean = false;

  interface GameCreationResponse {
  gameId: string;
  playerId: string;
  webSocketNotificationsEnabled: boolean;
  player1: string;
  player2: string | null;
  playerSymbol: 'X' | 'O';
  status: string;
}

interface GameStateResponse {
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
      wsWorking = true;
      updateGameStateFromWebSocket(data, true);
    });

    wsClient.onPlayerJoined((data: any) => {
      console.log('👋 Player joined notification received:', data);
      wsWorking = true;
      handlePlayerJoined(data);
    });
  }

  async function createNewGame() {
    try {
      const response = await fetch('/api/game/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName })
      });

      if (!response.ok) {
      throw new Error(`Failed to create game: ${response.statusText}`);
      }

      const data = await response.json() as GameCreationResponse;
      console.log('Game creation response:', data);
      wsWorking = data.webSocketNotificationsEnabled || false;
      console.log('WebSocket notifications enabled:', wsWorking);

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
          // Validate that we have all required data before connecting
          if (!gameState.gameId) {
            console.error('Cannot connect to WebSocket: missing gameId');
            return;
          }

          if (!playerId) {
            console.error('Cannot connect to WebSocket: missing playerId');
            return;
          }

          // Connect to WebSocket with proper error handling
          await wsClient.connect(gameState.gameId);

          // Wait a moment for the connection to establish
          const connected = await wsClient.waitForConnection(3000);

          if (connected) {
            console.log('✅ WebSocket connected successfully! Subscribing to updates...');
            wsClient.subscribeToGame(gameState.gameId, playerId);
          } else {
            console.warn('❌ WebSocket connection timeout - falling back to polling');
          }
        } catch (wsError) {
          console.error('WebSocket connection error:', wsError);
          console.log('Falling back to polling for game updates');
        }
      } else {
        console.warn('Cannot connect to WebSocket: missing wsClient or gameState');
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

  // Improved loadGameState function with better error handling
  async function loadGameState(gameId: string) {
  if (!gameId) {
    throw new Error('Cannot load game state without gameId');
  }

  try {
    const response = await fetch(`/api/game/${gameId}`);
    if (!response.ok) {
      throw new Error(`Failed to load game: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GameStateResponse;

    // Validate the response data
    if (!data.gameId) {
      throw new Error('Invalid game data: missing gameId');
    }

    // If we don't have a playerId yet, try to determine it based on our player name
    if (!playerId && data.player1 === playerName) {
      playerId = data.player1Id;
      console.log('Set playerId to player1 ID:', playerId);
    } else if (!playerId && data.player2 === playerName) {
      playerId = data.player2Id!;
      console.log('Set playerId to player2 ID:', playerId);
    }

    const wasMyTurn = isMyTurn;
    const previousBoard = gameState?.board;

    // Create the GameState object with correct player IDs from the server
    gameState = {
      gameId: data.gameId,
      board: data.board,
      status: data.status as GameStatusType,
      player1: {
        id: data.player1Id,
        symbol: 'X',
        name: data.player1
      },
      player2: data.player2 ? {
        id: data.player2Id!,
        symbol: 'O',
        name: data.player2
      } : undefined,
      lastPlayer: data.lastPlayer as PlayerSymbol | '',
      createdAt: Date.now(),
      lastMoveAt: data.lastMoveAt
      // Remove winner property - it doesn't exist in GameState
    };

    // IMPORTANT: Declare mySymbol here, before it's used
    const mySymbol = gameState!.player1.id === playerId ? 'X' : 'O';

    if (wasMyTurn !== isMyTurn) {
      console.log(
        'Turn changed - My symbol:',
        mySymbol,
        'Next player:',
        data.nextPlayer || (gameState!.lastPlayer === '' ? 'X' : (gameState!.lastPlayer === 'X' ? 'O' : 'X')),
        'Is my turn:',
        isMyTurn
      );
    }

    if (previousBoard && previousBoard !== gameState!.board) {
      console.log('Board updated from:', previousBoard, 'to:', gameState!.board);
    }

    // For PENDING games, only player 1 (X) should be "ready" but not actively playing
    if (data.status === 'PENDING') {
      isMyTurn = false; // No moves can be made in PENDING state
      console.log('Game is PENDING - waiting for second player');
    } else {
      isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';
      console.log('Turn setup - My symbol:', mySymbol, 'Next player:', data.nextPlayer, 'Is my turn:', isMyTurn);
    }

    // Note: Timer start/stop is now handled by GameTimer component via isMyTurn prop

    const gameOver = data.status !== 'ACTIVE' && data.status !== 'PENDING';
    if (gameOver) {
      playGameOverSound(data.status, mySymbol);
    }

  } catch (error) {
    console.error('Error loading game state:', error);
    throw error; // Re-throw to be handled by caller
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

      // Update local game state immediately for better UX
      updateGameStateFromWebSocket(data, false);
    } catch (error) {
      console.error('Error making move:', error);

      // Restore turn state if move failed
      isMyTurn = wasMyTurn; // This will restart the GameTimer if needed
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

  async function loadGameHistory() {
    // This would call a history API endpoint when implemented
    gameHistory = null;
  }

  // WebSocket handlers
  function updateGameStateFromWebSocket(data: any, fromWebSocket: boolean = true) {
    if (!gameState || !playerId) return;

    console.log('Updating game state from WebSocket:', data);

    gameState.board = data.board;
    gameState.status = data.status;
    gameState.lastPlayer = data.lastPlayer;
    gameState.lastMoveAt = data.lastMoveAt;

    if (fromWebSocket) {
      wsWorking = true;
      console.log('📩 Real WebSocket notification - disabling polling');
    }

    // Determine if it's my turn based on actual player ID comparison
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';

    // Handle PENDING vs ACTIVE states properly
    if (data.status === 'PENDING') {
      isMyTurn = false; // Can't make moves in PENDING state
      console.log('WebSocket update - Game still PENDING');
    } else {
      isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';
      console.log(
        'WebSocket turn update - My symbol:',
        mySymbol,
        'Next player:',
        data.nextPlayer,
        'Is my turn:',
        isMyTurn
      );
    }

    // Note: Timer management is now handled by GameTimer component

    const gameOver = data.status !== 'ACTIVE' && data.status !== 'PENDING';
    if (gameOver) {
      playGameOverSound(data.status, mySymbol);
      loadGameHistory();
    }
  }


  function playGameOverSound(status: string, mySymbol: 'X' | 'O') {
    if (status === 'TIE') {
      gameAudio.playGameTie();
    } else if (status.endsWith('_WIN')) {
      playWonOrLostSound(status, mySymbol);
    }
  }

  function playWonOrLostSound(status: string, mySymbol: 'X' | 'O') {
    const winnerSymbol = status.startsWith('X') ? 'X' : 'O';
    if (winnerSymbol === mySymbol) {
      gameAudio.playGameWon();
    } else {
      gameAudio.playGameLost();
    }
  }


  function handlePlayerJoined(data: any) {
    if (!gameState) return;

    console.log('Handling player joined:', data);

    // Update game state with new player info
    gameState.status = data.status;
    gameState.player2 = data.player2
      ? {
          id: data.player2.id,
          symbol: 'O',
          name: data.player2.name
        }
      : undefined;
    gameState.lastPlayer = data.lastPlayer;
    gameState.lastMoveAt = data.lastMoveAt;

    // Now the game should be ACTIVE and X goes first
    const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';
    isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';

    console.log(
      'Player joined - Game status:',
      data.status,
      'My symbol:',
      mySymbol,
      'Next player:',
      data.nextPlayer,
      'Is my turn:',
      isMyTurn
    );

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
        <button on:click={createNewGame} class="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">
          Play
        </button>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      <!-- GameTimer Component - replaces timer variables and functions -->
      <GameTimer {isMyTurn} onTimeout={() => endGame('TIMEOUT')} timerDuration={10} />

      <!-- GamePoller Component - only enabled when WebSocket is not connected -->
      <GamePoller
        gameId={gameState.gameId}
        gameStatus={gameState.status}
        onGameUpdate={loadGameState}
        enabled={!wsWorking}
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
        on:cellClick={e => makeMove(e.detail.position)}
      />

      <GameControls
        gameStatus={gameState?.status || 'PENDING'}
        canQuit={gameState && (gameState.status === 'ACTIVE' || gameState.status === 'PENDING')}
        isInGame={gameState !== null}
        on:newGame={() => {
          gameState = null;
        }}
        on:quitGame={() => endGame('RESIGN')}
      />
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
