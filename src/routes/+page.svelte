<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import GameBoard from '$lib/components/Game/GameBoard.svelte';
  import GameStatus from '$lib/components/Game/GameStatus.svelte';
  import GameControls from '$lib/components/Game/GameControls.svelte';
  import PlayerHistory from '$lib/components/Game/PlayerHistory.svelte';
  import type { GameState, GameHistory } from '$lib/types/game.ts';

  // Game state
  let gameState: GameState | null = null;
  let gameHistory: GameHistory | null = null;
  let playerName: string = '';
  let playerId: string = '';
  let isMyTurn: boolean = false;
  let timeRemaining: number | null = null;
  let gameTimer: number | null = null;

  // Game lifecycle
  onMount(() => {
    if (browser) {
      // Get or create player name
      playerName = localStorage.getItem('ttt-player-name') || '';
      if (!playerName) {
        playerName = prompt('Enter your name:') || `Player${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem('ttt-player-name', playerName);
      }
      playerId = generatePlayerId(playerName);
    }
  });

  $: if (browser && playerId) {
    console.log('Frontend playerId:', playerId);
  }

  // API calls
  async function createNewGame() {
    try {
      console.log('Creating game with playerName:', playerName, 'playerId:', playerId);
      const response = await fetch('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName })
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const result = await response.json();

      if (result.status === 'ACTIVE') {
        // Game started immediately
        await loadGameState(result.gameId);
        await loadGameHistory();
      } else {
        // Waiting for opponent
        await loadGameState(result.gameId);
        startPollingForOpponent();
      }
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
      gameState = {
        gameId: data.gameId,
        board: data.board,
        status: data.status,
        player1: { id: playerId, symbol: 'X', name: data.player1 },
        player2: data.player2 ? { id: 'other', symbol: 'O', name: data.player2 } : undefined,
        lastPlayer: '',
        createdAt: Date.now(),
        lastMoveAt: data.lastMoveAt
      };

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

      const result = await response.json();
      updateGameState(result);

      if (result.status !== 'ACTIVE') {
        // Game ended
        stopGameTimer();
        await loadGameHistory();
      } else {
        // Continue polling for opponent's move
        startPollingForMove();
      }
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
        await loadGameState(gameState.gameId);
        stopGameTimer();
      }
    } catch (error) {
      console.error('Error quitting game:', error);
    }
  }

  async function loadGameHistory() {
    // This would call a history API endpoint when implemented
    // For now, we'll skip it
    gameHistory = null;
  }

  // Game state management
  function updateGameState(data: any) {
    if (!gameState) return;

    gameState.board = data.board;
    gameState.status = data.status;

    // Determine if it's my turn
    const mySymbol = gameState.player1.name === playerName ? 'X' : 'O';
    isMyTurn = data.nextPlayer === mySymbol && data.status === 'ACTIVE';

    if (isMyTurn) {
      startGameTimer();
    } else {
      stopGameTimer();
    }
  }

  function startPollingForOpponent() {
    const pollInterval = setInterval(async () => {
      if (gameState) {
        await loadGameState(gameState.gameId);
        if (gameState.status === 'ACTIVE') {
          clearInterval(pollInterval);
          await loadGameHistory();
        }
      }
    }, 2000);
  }

  function startPollingForMove() {
    const pollInterval = setInterval(async () => {
      if (gameState && gameState.status === 'ACTIVE') {
        await loadGameState(gameState.gameId);
        if (isMyTurn || gameState.status !== 'ACTIVE') {
          clearInterval(pollInterval);
        }
      }
    }, 1000);
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
  function generatePlayerId(name: string): string {
    return `player_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  function getCurrentPlayerSymbol(): 'X' | 'O' | null {
    if (!gameState || gameState.status !== 'ACTIVE') return null;
    return gameState.player1.name === playerName ? 'X' : 'O';
  }

  function getOpponentName(): string | null {
    if (!gameState) return null;
    return gameState.player1.name === playerName ? gameState.player2?.name || null : gameState.player1.name;
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
