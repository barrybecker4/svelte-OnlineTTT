<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GameStatus } from '$lib/types/game.ts';

  export let gameStatus: GameStatus;
  export let canQuit: boolean = false;
  export let isInGame: boolean = false;

  const dispatch = createEventDispatcher<{
    newGame: void;
    quitGame: void;
  }>();

  function handleNewGame() {
    dispatch('newGame');
  }

  function handleQuit() {
    if (confirm('Are you sure you want to quit this game?')) {
      dispatch('quitGame');
    }
  }

  $: showNewGameButton = !isInGame || gameStatus === 'PENDING' || isGameComplete();
  $: showQuitButton = canQuit && isInGame && !isGameComplete();

  function isGameComplete(): boolean {
    return gameStatus !== 'PENDING' && gameStatus !== 'ACTIVE';
  }
</script>

<div class="game-controls">
  {#if showNewGameButton}
    <button class="btn btn-primary" on:click={handleNewGame}>
      {isInGame ? 'New Game' : 'Play'}
    </button>
  {/if}

  {#if showQuitButton}
    <button class="btn btn-secondary" on:click={handleQuit}> Quit Game </button>
  {/if}
</div>

<style>
  .game-controls {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin: 20px 0;
  }

  .btn {
    padding: 12px 24px;
    font-size: 18px;
    font-weight: bold;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .btn:active {
    transform: translateY(0);
  }

  .btn-primary {
    background: #005588;
    color: white;
  }

  .btn-primary:hover {
    background: #004466;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #5a6268;
  }

  @media (max-width: 768px) {
    .game-controls {
      flex-direction: column;
      align-items: center;
    }

    .btn {
      width: 200px;
    }
  }
</style>
