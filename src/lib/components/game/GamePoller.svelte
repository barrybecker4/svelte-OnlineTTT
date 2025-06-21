<script lang="ts">
  import { onDestroy } from 'svelte';

  // Props
  export let gameId: string | null = null;
  export let gameStatus: string | null = null;
  export let onGameUpdate: (gameId: string) => Promise<void> = async () => {};
  export let enabled: boolean = true;
  export let pollingInterval: number = 2000; // milliseconds

  // State
  let devPollingInterval: ReturnType<typeof setInterval> | null = null;
  let isPolling: boolean = false;

  // Reactive: start/stop polling based on props
  $: {
    console.log(
      '🔍 GamePoller reactive - enabled:',
      enabled,
      'gameId:',
      gameId,
      'status:',
      gameStatus,
      'isPolling:',
      isPolling
    );

    if (!enabled && isPolling) {
      console.log('🛑 GamePoller: Stopping polling - disabled by parent');
      stopPolling();
    } else if (enabled && gameId) {
      const shouldPoll = shouldPollStatus(gameStatus);

      if (shouldPoll && !isPolling) {
        console.log('🔄 GamePoller: Starting polling for', gameId);
        startPolling(gameId);
      } else if (!shouldPoll && isPolling) {
        console.log('🛑 GamePoller: Stopping polling - game completed');
        stopPolling();
      }
    } else if (!gameId && isPolling) {
      console.log('🛑 GamePoller: Stopping polling - no gameId');
      stopPolling();
    }
  }

  function shouldPollStatus(status: string | null): boolean {
    // Only poll for active or pending games
    return status === 'ACTIVE' || status === 'PENDING';
  }

  function startPolling(gameIdToPoll: string) {
    // Don't start if already polling the same game
    if (isPolling) {
      return;
    }

    stopPolling(); // Clean up any existing polling

    console.log(`🔄 Starting development polling for game ${gameIdToPoll} (${pollingInterval}ms intervals)`);
    isPolling = true;

    devPollingInterval = setInterval(async () => {
      try {
        if (gameId === gameIdToPoll) {
          // Make sure we're still polling the right game
          console.log('📡 Polling for game updates...');
          await onGameUpdate(gameIdToPoll);

          // Check if we should stop polling after the update
          if (!shouldPollStatus(gameStatus)) {
            console.log('🛑 Game completed, stopping polling');
            stopPolling();
          }
        } else {
          // Game ID changed, stop this polling cycle
          stopPolling();
        }
      } catch (error) {
        console.error('📡 Polling error:', error);
        // Continue polling despite errors - they might be temporary
      }
    }, pollingInterval);
  }

  function stopPolling() {
    if (devPollingInterval) {
      console.log('🛑 Stopping development polling');
      clearInterval(devPollingInterval);
      devPollingInterval = null;
    }
    isPolling = false;
  }

  // Clean up on component destroy
  onDestroy(() => {
    stopPolling();
  });

  // Export functions for manual control
  export function forceStart() {
    if (gameId) {
      startPolling(gameId);
    }
  }

  export function forceStop() {
    stopPolling();
  }

  export function getPollingStatus() {
    return {
      isPolling,
      gameId,
      gameStatus,
      enabled
    };
  }
</script>

<!-- Optional debug display -->
{#if enabled && gameId}
  <div class="game-poller-debug" title="Development polling active">
    <div class="polling-indicator" class:active={isPolling}>
      {#if isPolling}
        <span class="pulse">📡</span>
        <span class="status">Polling {gameId.slice(0, 8)}...</span>
      {:else}
        <span>📡</span>
        <span class="status">Polling stopped</span>
      {/if}
    </div>
  </div>
{/if}

<style>
  .game-poller-debug {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-family: 'Courier New', monospace;
    z-index: 1000;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  .game-poller-debug:hover {
    opacity: 1;
  }

  .polling-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .polling-indicator.active .pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  .status {
    opacity: 0.8;
  }

  /* Hide debug display in production */
  @media (max-width: 768px) {
    .game-poller-debug {
      display: none;
    }
  }
</style>
