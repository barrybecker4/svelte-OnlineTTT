<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import GameBoard from '$lib/components/game/GameBoard.svelte';
  import GameStatus from '$lib/components/game/GameStatus.svelte';
  import GameControls from '$lib/components/game/GameControls.svelte';
  import PlayerHistory from '$lib/components/game/PlayerHistory.svelte';
  import GameTimer from '$lib/components/game/GameTimer.svelte';
  import GamePoller from '$lib/components/game/GamePoller.svelte';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  import type { GameState, GameHistory } from '$lib/types/game.ts';
  import { getWebSocketClient } from '$lib/websocket/client.ts';
  import { GameMatchingService } from '$lib/game/matching';
  import { gameAudio } from '$lib/audio/Audio';

  let gameState: GameState | null = null;
  let gameHistory: GameHistory | null = null;
  let gameMatchingService: GameMatchingService;
  let playerName: string = '';
  let playerId: string = '';
  let isMyTurn: boolean = false;
  let wsClient: any = null;
  let wsWorking: boolean = false;


  onMount(() => {
    if (browser) {
      playerName = getPlayerName();
      gameMatchingService = new GameMatchingService();
      wsClient = getWebSocketClient();
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
      console.log('🎯 Starting game creation for player:', playerName);
      
      // Use the matching service instead of complex fetch logic
      const result = await gameMatchingService.findOrCreateGame(playerName);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create/join game');
      }
      
      console.log('✅ Game join successful:', result);
      
      // Set player data from the service result
      playerId = result.playerId;
      wsWorking = false; // Will be set to true if WebSocket works
      
      // Load the full game state using the service
      gameState = await gameMatchingService.loadGameState(result.gameId);
      
      if (!gameState) {
        throw new Error('Failed to load game state');
      }
      
      console.log('✅ Game state loaded:', gameState);
      
      // Try to connect to WebSocket (existing logic)
      if (wsClient && gameState) {
        console.log('🔌 Attempting WebSocket connection for game:', gameState.gameId);
        try {
          await connectToWebSocket(gameState.gameId, playerId);
        } catch (wsError) {
          console.error('❌ WebSocket connection error:', wsError);
          console.log('📡 Falling back to polling for game updates');
        }
      }
      
    } catch (error) {
      console.error('❌ Error creating game:', error);
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

  if (typeof window !== 'undefined') {
    const handleBeforeUnload = () => {
      if (gameState && playerId && (gameState.status === 'ACTIVE' || gameState.status === 'PENDING')) {
        // Send quit request when user closes tab
        navigator.sendBeacon(`/api/game/${gameState.gameId}/quit`, JSON.stringify({
          playerId: playerId,
          reason: 'RESIGN'
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup
    onDestroy(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    });
  }

  async function connectToWebSocket(gameId: string, playerId: string) {
    if (!gameId) {
      console.error('Cannot connect to WebSocket: missing gameId');
      return;
    }

    if (!playerId) {
      console.error('Cannot connect to WebSocket: missing playerId');
      return;
    }

    // Connect to WebSocket with proper error handling
    await wsClient.connect(gameId);

    // Wait a moment for the connection to establish
    const connected = await wsClient.waitForConnection(3000);

    if (connected) {
      console.log('✅ WebSocket connected successfully! Subscribing to updates...');
      wsClient.subscribeToGame(gameId, playerId);
    } else {
      console.warn('❌ WebSocket connection timeout - falling back to polling');
    }
  }

  async function handleGameStateUpdate(gameId: string): Promise<void> {
    try {
      const newGameState = await gameMatchingService.loadGameState(gameId);
      
      if (!newGameState) {
        console.error('Failed to load game state for:', gameId);
        return;
      }
      
      const wasMyTurn = isMyTurn;
      const previousBoard = gameState?.board;
      gameState = newGameState;
      
      const mySymbol = gameState.player1.id === playerId ? 'X' : 'O';
      
      if (gameState.status === 'PENDING') {
        isMyTurn = false; // Can't make moves in PENDING state
      } else {
        // For ACTIVE games, determine turn based on lastPlayer
        const nextPlayer = gameState.lastPlayer === '' ? 'X' : 
                          gameState.lastPlayer === 'X' ? 'O' : 'X';
        isMyTurn = nextPlayer === mySymbol && gameState.status === 'ACTIVE';
      }
      
      if (wasMyTurn !== isMyTurn) {
        console.log('🔄 Turn changed - My symbol:', mySymbol, 'Is my turn:', isMyTurn);
      }
      
      if (previousBoard && previousBoard !== gameState.board) {
        console.log('📋 Board updated from:', previousBoard, 'to:', gameState.board);
      }
      
    } catch (error) {
      console.error('❌ Error updating game state:', error);
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

      <GamePoller
        gameId={gameState.gameId}
        gameStatus={gameState.status}
        onGameUpdate={handleGameStateUpdate}
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
