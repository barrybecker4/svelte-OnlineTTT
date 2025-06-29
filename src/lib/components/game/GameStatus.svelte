<script lang="ts">
  import type { GameStatus } from '$lib/types/game.ts';

  export let status: GameStatus;
  export let currentPlayer: 'X' | 'O';
  export let player1Name: string;
  export let player2Name: string | null = null;
  export let isMyTurn: boolean = false;
  export let timeRemaining: number | null = null;

  $: statusMessage = getStatusMessage(status, currentPlayer, isMyTurn);

  function getStatusMessage(status: GameStatus, currentPlayer: 'X' | 'O', isMyTurn: boolean): string {
    switch (status) {
      case 'PENDING':
        return 'Waiting for opponent...';
      case 'ACTIVE':
        if (isMyTurn) {
          return `Your turn (${currentPlayer})`;
        } else {
          return `Waiting for ${getOtherPlayerName()}'s move...`;
        }
      case 'X_WIN':
        return getPersonalizedWinMessage('X', currentPlayer);
      case 'O_WIN':
        return getPersonalizedWinMessage('O', currentPlayer);
      case 'TIE':
        return "It's a tie! 🤝";
      case 'X_BY_RESIGN':
        return getPersonalizedResignMessage('X', currentPlayer);
      case 'O_BY_RESIGN':
        return getPersonalizedResignMessage('O', currentPlayer);
      case 'X_BY_TIMEOUT':
        return getPersonalizedTimeoutMessage('X', currentPlayer);
      case 'O_BY_TIMEOUT':
        return getPersonalizedTimeoutMessage('O', currentPlayer);
      default:
        return 'Unknown game state';
    }
  }

  function getPersonalizedWinMessage(winnerSymbol: 'X' | 'O', mySymbol: 'X' | 'O'): string {
    if (winnerSymbol === mySymbol) {
      return `🎉 You won!`;
    } else {
      const opponentName = getPlayerName(winnerSymbol);
      return `😞 You lost! ${opponentName} won.`;
    }
  }

  function getPersonalizedResignMessage(winnerSymbol: 'X' | 'O', mySymbol: 'X' | 'O'): string {
    if (winnerSymbol === mySymbol) {
      const opponentName = getPlayerName(getOtherSymbol(winnerSymbol));
      return `🎉 You won! ${opponentName} resigned.`;
    } else {
      return `😞 You lost! You resigned.`;
    }
  }

  function getPersonalizedTimeoutMessage(winnerSymbol: 'X' | 'O', mySymbol: 'X' | 'O'): string {
    if (winnerSymbol === mySymbol) {
      const opponentName = getPlayerName(getOtherSymbol(winnerSymbol));
      return `🎉 You won! ${opponentName} timed out.`;
    } else {
      return `😞 You lost! You timed out.`;
    }
  }

  function getOtherPlayerName(): string {
    return getPlayerName(getOtherPlayer());
  }

  function getOtherPlayer(): 'X' | 'O' {
    return currentPlayer === 'X' ? 'O' : 'X';
  }

  function getOtherSymbol(symbol: 'X' | 'O'): 'X' | 'O' {
    return symbol === 'X' ? 'O' : 'X';
  }

  function getPlayerName(symbol: 'X' | 'O' | null): string {
    if (!symbol) return 'Unknown';
    return symbol === 'X' ? player1Name : player2Name || 'Player 2';
  }

  function isGameActive(): boolean {
    return status === 'ACTIVE' || status === 'PENDING';
  }

  function isGameComplete(): boolean {
    return !isGameActive();
  }
</script>

<div
  class="game-status"
  class:pending={status === 'PENDING'}
  class:active={status === 'ACTIVE'}
  class:complete={isGameComplete()}
>
  <h2 class="status-message">{statusMessage}</h2>

  {#if status === 'ACTIVE' && timeRemaining !== null}
    <div class="timer" class:warning={timeRemaining <= 10}>
      Time remaining: {timeRemaining}s
    </div>
  {/if}

  {#if status === 'PENDING'}
    <p class="help-text">Share your game link with a friend to start playing!</p>
  {/if}

  {#if status === 'ACTIVE'}
    <div class="players">
      <div class="player" class:active={currentPlayer === 'X'}>
        <span class="symbol x">X</span>
        <span class="name">{player1Name}</span>
      </div>
      <div class="vs">vs</div>
      <div class="player" class:active={currentPlayer === 'O'}>
        <span class="symbol o">O</span>
        <span class="name">{player2Name || 'Waiting...'}</span>
      </div>
    </div>
  {/if}
</div>


<style>
  .game-status {
    text-align: center;
    margin: 20px 0;
    padding: 20px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .game-status.pending {
    background: #fff3cd;
    border: 2px solid #ffeaa7;
  }

  .game-status.active {
    background: #d1ecf1;
    border: 2px solid #bee5eb;
  }

  .game-status.complete {
    background: #d4edda;
    border: 2px solid #c3e6cb;
  }

  .status-message {
    color: #005588;
    margin: 0 0 10px 0;
    font-size: 24px;
  }

  .timer {
    font-size: 18px;
    font-weight: bold;
    color: #666;
    margin: 10px 0;
  }

  .timer.warning {
    color: #ff4444;
    animation: pulse 1s ease-in-out infinite;
  }

  .help-text {
    color: #856404;
    font-style: italic;
    margin: 10px 0;
  }

  .players {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 15px;
  }

  .player {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .player.active {
    background: rgba(0, 85, 136, 0.1);
    border: 2px solid #005588;
  }

  .symbol {
    font-size: 20px;
    font-weight: bold;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .symbol.x {
    color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
  }

  .symbol.o {
    color: #4444ff;
    background: rgba(68, 68, 255, 0.1);
  }

  .name {
    font-weight: 500;
    color: #005588;
  }

  .vs {
    color: #666;
    font-weight: bold;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @media (max-width: 768px) {
    .players {
      flex-direction: column;
      gap: 10px;
    }

    .vs {
      order: 2;
    }
  }
</style>
