<script lang="ts">
  export let formattedHistory: string | null = null;
</script>

{#if formattedHistory}
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
