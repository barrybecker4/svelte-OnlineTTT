<script lang="ts">
  import { onDestroy } from 'svelte';
  import { gameAudio } from '$lib/audio/Audio';

  // Props
  export let isMyTurn: boolean = false;
  export let timerDuration: number = 10; // seconds
  export let onTimeout: () => void = () => {};

  // State
  let timeRemaining: number | null = null;
  let gameTimer: number | null = null;
  let currentTurnStartTime: number | null = null;

  // Reactive: start/stop timer based on turn changes
  $: {
    const shouldBeRunning = isMyTurn;
    const isRunning = gameTimer !== null;

    if (shouldBeRunning && !isRunning) {
      startTimer();
    } else if (!shouldBeRunning && isRunning) {
      stopTimer();
    }
  }

  function startTimer() {
    // Only start a new timer if we don't already have one running
    if (gameTimer !== null) {
      return; // Timer already running, don't restart it
    }

    stopTimer(); // Clean up any existing timer (just in case)
    timeRemaining = timerDuration;
    currentTurnStartTime = Date.now();

    console.log(`🕐 Starting ${timerDuration}s turn timer`);

    gameTimer = setInterval(() => {
      if (timeRemaining !== null) {
        timeRemaining--;

        // Play warning sound for each second from 5 down to 1
        if (timeRemaining <= 5 && timeRemaining > 0) {
          gameAudio.playTimerWarning(timeRemaining);
        }

        if (timeRemaining <= 0) {
          console.log('⏰ Timer expired - calling timeout handler');
          stopTimer();
          onTimeout();
        }
      }
    }, 1000);
  }

  function stopTimer() {
    if (gameTimer) {
      console.log('🛑 Stopping turn timer');
      clearInterval(gameTimer);
      gameTimer = null;
    }
    timeRemaining = null;
    currentTurnStartTime = null;
  }

  // Force stop timer when component is destroyed
  onDestroy(() => {
    stopTimer();
  });

  // Export functions for manual control if needed
  export function forceStart() {
    startTimer();
  }

  export function forceStop() {
    stopTimer();
  }
</script>

{#if timeRemaining !== null && isMyTurn}
  <div 
    class="game-timer"
    class:warning={timeRemaining <= 5}
    class:critical={timeRemaining <= 3}
  >
    <div class="timer-display">
      <span class="time">{timeRemaining}</span>
      <span class="label">seconds</span>
    </div>
    <div class="timer-bar">
      <div 
        class="timer-fill" 
        style="width: {(timeRemaining / timerDuration) * 100}%"
      ></div>
    </div>
  </div>
{/if}

<style>
  .game-timer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid rgb(59, 130, 246);
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .game-timer.warning {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgb(245, 158, 11);
  }

  .game-timer.critical {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgb(239, 68, 68);
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .timer-display {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .time {
    font-size: 2rem;
    font-weight: bold;
    font-family: 'Courier New', monospace;
  }

  .label {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .timer-bar {
    width: 100px;
    height: 6px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    overflow: hidden;
  }

  .timer-fill {
    height: 100%;
    background: currentColor;
    transition: width 1s linear;
    border-radius: 3px;
  }

  .warning .timer-fill {
    background: rgb(245, 158, 11);
  }

  .critical .timer-fill {
    background: rgb(239, 68, 68);
  }
</style>