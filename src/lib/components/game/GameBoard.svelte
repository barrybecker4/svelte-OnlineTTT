<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let board: string = '_________'; // 9-character string
  export let winningPositions: number[] | null = null;
  export let disabled: boolean = false;
  export let currentPlayerSymbol: 'X' | 'O' | null = null;

  const dispatch = createEventDispatcher<{
    cellClick: { position: number };
  }>();

  function handleCellClick(position: number) {
    if (disabled || board[position] !== '_') return;
    dispatch('cellClick', { position });
  }

  function getCellSymbol(position: number): string {
    const symbol = board[position];
    return symbol === '_' ? '' : symbol;
  }

  function isCellWinning(position: number): boolean {
    return winningPositions?.includes(position) ?? false;
  }

  function isCellOccupied(position: number): boolean {
    return board[position] !== '_';
  }
</script>

<div class="game-board">
  {#each Array(9) as _, position}
    <button
      class="cell"
      class:occupied={isCellOccupied(position)}
      class:winning={isCellWinning(position)}
      class:disabled
      class:hover-x={!disabled && !isCellOccupied(position) && currentPlayerSymbol === 'X'}
      class:hover-o={!disabled && !isCellOccupied(position) && currentPlayerSymbol === 'O'}
      on:click={() => handleCellClick(position)}
      disabled={disabled || isCellOccupied(position)}
    >
      <span class="symbol" class:x={getCellSymbol(position) === 'X'} class:o={getCellSymbol(position) === 'O'}>
        {getCellSymbol(position)}
      </span>
    </button>
  {/each}
</div>

<style>
  .game-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    width: 300px;
    height: 300px;
    margin: 0 auto;
    padding: 8px;
    background: #005588;
    border-radius: 8px;
  }

  .cell {
    background: #ddeeff;
    border: 2px solid #005588;
    border-radius: 4px;
    font-size: 48px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cell:hover:not(.disabled):not(.occupied) {
    background: #ccddff;
    transform: scale(1.05);
  }

  .cell.hover-x:hover:not(.occupied)::before {
    content: 'X';
    color: #666;
    opacity: 0.5;
  }

  .cell.hover-o:hover:not(.occupied)::before {
    content: 'O';
    color: #666;
    opacity: 0.5;
  }

  .cell.occupied {
    cursor: default;
  }

  .cell.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .cell.winning {
    background: #ffee88;
    animation: winning-pulse 1s ease-in-out infinite alternate;
  }

  .symbol.x {
    color: #ff4444;
  }

  .symbol.o {
    color: #4444ff;
  }

  @keyframes winning-pulse {
    from {
      background: #ffee88;
    }
    to {
      background: #ffcc44;
    }
  }

  @media (max-width: 768px) {
    .game-board {
      width: 250px;
      height: 250px;
    }

    .cell {
      font-size: 36px;
    }
  }
</style>
