<script lang="ts">
  import type { GameHistory } from '$lib/types/game.ts';

  export let history: GameHistory | null = null;
  export let currentPlayerName: string;
  export let opponentName: string | null = null;

  $: formattedHistory = history ? formatHistory(history, currentPlayerName) : null;

  function formatHistory(history: GameHistory, playerName: string): string {
    if (history.totalEncounters === 0) {
      return `This is the first time you are playing against <strong>${opponentName}</strong>.`;
    }

    let text = `You have played <strong>${opponentName}</strong> ${history.totalEncounters} times in the past.<br>`;

    // Determine which stats apply to current player
    const isPlayer1 = history.player1 === playerName;
    const playerAsX = isPlayer1 ? history.player1AsX : history.player2AsX;
    const playerAsO = isPlayer1 ? history.player2AsX : history.player1AsX;

    text += formatResultLine(
      'X',
      playerAsX.totalWins,
      playerAsX.totalLosses,
      playerAsX.totalTies,
      playerAsX.wins,
      playerAsX.losses
    );
    text += formatResultLine(
      'O',
      playerAsO.totalWins,
      playerAsO.totalLosses,
      playerAsO.totalTies,
      playerAsO.wins,
      playerAsO.losses
    );

    return text;
  }

  function formatResultLine(
    symbol: string,
    wins: number,
    losses: number,
    ties: number,
    winDetails: any,
    lossDetails: any
  ): string {
    const winParen = getWinLossDetails(winDetails);
    const lossParen = getWinLossDetails(lossDetails);

    return `As player <strong>${symbol}</strong> you won ${wins}${winParen}, lost ${losses}${lossParen}, and tied ${ties}.<br>`;
  }

  function getWinLossDetails(details: { byResignation: number; byTimeout: number }): string {
    if (details.byResignation + details.byTimeout === 0) {
      return '';
    }

    let result = ' (';
    const parts = [];

    if (details.byResignation) {
      parts.push(`${details.byResignation} by resignation`);
    }
    if (details.byTimeout) {
      parts.push(`${details.byTimeout} by timeout`);
    }

    result += parts.join(', ') + ')';
    return result;
  }
</script>

{#if formattedHistory && opponentName}
  <div class="player-history">
    <h3>Game History</h3>
    <div class="history-content">
      {@html formattedHistory}
    </div>
  </div>
{/if}

<style>
  .player-history {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 16px;
    margin: 20px 0;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .player-history h3 {
    color: #005588;
    margin: 0 0 12px 0;
    font-size: 18px;
  }

  .history-content {
    font-size: 14px;
    line-height: 1.5;
    color: #495057;
  }

  .history-content :global(strong) {
    color: #005588;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .player-history {
      margin: 20px 10px;
    }
  }
</style>
