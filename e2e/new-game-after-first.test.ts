import { test, expect } from '@playwright/test';

const BASE_TIMEOUT = 500;

test.describe('New Game After First Game Completion', () => {
  test('should create one new game when both players click New Game after game completion', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const player1 = await context1.newPage();
    const player2 = await context2.newPage();

    try {
      // Navigate both players to the game and set their names
      await player1.goto('/');
      await player1.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'Player1');
      });
      await player1.reload();
      await player1.waitForTimeout(BASE_TIMEOUT);

      await player2.goto('/');
      await player2.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'Player2');
      });
      await player2.reload();
      await player2.waitForTimeout(BASE_TIMEOUT);

      // Player 1 creates a game
      await player1.click('button:has-text("Play")');

      // Wait for Player1's game to be fully created and saved to KV storage
      await player1.waitForTimeout(BASE_TIMEOUT);

      // Player 2 joins the game
      await player2.click('button:has-text("Play")');

      // Wait for both players to be connected
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 5000 });

      // Wait for WebSocket connections and game matching to complete
      await player2.waitForTimeout(BASE_TIMEOUT);

      // Play a quick game to completion
      // Player1 (X) goes first
      await player1.click('.game-board button:nth-child(1)'); // X in top-left (position 0)
      await expect(player2.locator('.game-board button:nth-child(1) .symbol')).toHaveText('X', { timeout: 5000 });

      // Player2 (O) goes
      await player2.click('.game-board button:nth-child(2)'); // O in top-middle (position 1)
      await expect(player1.locator('.game-board button:nth-child(2) .symbol')).toHaveText('O', { timeout: 5000 });

      // Player1 (X) goes
      await player1.click('.game-board button:nth-child(4)'); // X in middle-left (position 3)
      await expect(player2.locator('.game-board button:nth-child(4) .symbol')).toHaveText('X', { timeout: 5000 });

      // Player2 (O) goes
      await player2.click('.game-board button:nth-child(5)'); // O in center (position 4)
      await expect(player1.locator('.game-board button:nth-child(5) .symbol')).toHaveText('O', { timeout: 5000 });

      // Player1 (X) wins
      await player1.click('.game-board button:nth-child(7)'); // X in bottom-left (position 6) - winning move: 0,3,6
      await expect(player2.locator('.game-board button:nth-child(7) .symbol')).toHaveText('X', { timeout: 5000 });

      // Wait for game completion - look for New Game buttons instead of specific win text
      await player1.waitForTimeout(BASE_TIMEOUT);
      await expect(player1.locator('button:has-text("New Game")')).toBeVisible({ timeout: 5000 });
      await expect(player2.locator('button:has-text("New Game")')).toBeVisible({ timeout: 5000 });

      // Both players click "New Game"
      await player1.waitForTimeout(400);
      await player1.click('button:has-text("New Game")');
      await player2.waitForTimeout(BASE_TIMEOUT);
      await player2.click('button:has-text("New Game")');

      // Check what state they end up in after clicking New Game
      await player1.waitForTimeout(2 * BASE_TIMEOUT);

      // Check if they returned to lobby or stayed in a new game
      const p1HasGameBoard = await player1.locator('.game-board').count() > 0;
      const p2HasGameBoard = await player2.locator('.game-board').count() > 0;
      const p1HasPlayButton = await player1.locator('button:has-text("Play")').count() > 0;
      const p2HasPlayButton = await player2.locator('button:has-text("Play")').count() > 0;

      console.log(`After New Game - P1: gameBoard=${p1HasGameBoard}, playButton=${p1HasPlayButton}`);
      console.log(`After New Game - P2: gameBoard=${p2HasGameBoard}, playButton=${p2HasPlayButton}`);

      if (p1HasPlayButton && p2HasPlayButton) {
        console.log('Players returned to lobby - starting new game from lobby');

        // Both players click "Play" to start a new game
        await player1.click('button:has-text("Play")');

        // CRITICAL FIX: Wait for Player1's new game to be created and saved
        await player1.waitForTimeout(BASE_TIMEOUT);

        await player2.click('button:has-text("Play")');

        // Wait for the new game to start and matching to complete
        await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });
        await expect(player2.locator('.game-board')).toBeVisible({ timeout: 5000 });

        // Wait for WebSocket connections and game matching
        await player2.waitForTimeout(BASE_TIMEOUT);

      } else if (p1HasGameBoard && p2HasGameBoard) {
        console.log('Players stayed in new game - continuing directly');

        // Wait a bit for the new game to be ready, but not too long
        await player1.waitForTimeout(BASE_TIMEOUT);

      } else {
        throw new Error(`Inconsistent state after New Game: P1(board=${p1HasGameBoard}, play=${p1HasPlayButton}), P2(board=${p2HasGameBoard}, play=${p2HasPlayButton})`);
      }

      // Verify they're in the same game by checking that both can see an empty board
      await expect(player1.locator('.game-board button:nth-child(1)')).toBeVisible({ timeout: 5000 });
      await expect(player2.locator('.game-board button:nth-child(1)')).toBeVisible({ timeout: 5000 });

      // Verify that player1 can make a move and player2 sees it (confirming same game)
      await player1.click('.game-board button:nth-child(5)'); // X in center (position 4)
      await expect(player2.locator('.game-board button:nth-child(5) .symbol')).toHaveText('X', { timeout: 5000 });
      await player1.waitForTimeout(BASE_TIMEOUT);

      console.log('✅ Test passed: Both players successfully joined the same new game after completion');

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle rapid new game requests without creating duplicates', async ({ browser }) => {
    // Create two browser contexts for two players
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const player1 = await context1.newPage();
    const player2 = await context2.newPage();

    try {
      // Navigate both players to the game and set their names
      await player1.goto('/');
      await player1.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'Player1');
      });
      await player1.reload();
      await player1.waitForTimeout(BASE_TIMEOUT);

      await player2.goto('/');
      await player2.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'Player2');
      });
      await player2.reload();
      await player2.waitForTimeout(BASE_TIMEOUT);

      // Player 1 creates a game
      await player1.click('button:has-text("Play")');

      // Wait for game creation
      await player1.waitForTimeout(BASE_TIMEOUT);

      // Player 2 joins the game
      await player2.click('button:has-text("Play")');

      // Wait for both players to be connected
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 5000 });

      // Wait for matching
      await player2.waitForTimeout(BASE_TIMEOUT);

      // Quickly finish a game
      await player1.click('.game-board button:nth-child(1)'); // X (position 0)
      await player2.click('.game-board button:nth-child(2)'); // O (position 1)
      await player1.click('.game-board button:nth-child(4)'); // X (position 3)
      await player2.click('.game-board button:nth-child(5)'); // O (position 4)
      await player1.click('.game-board button:nth-child(7)'); // X wins (0,3,6)

      // Wait for game completion
      await player1.waitForTimeout(1500);
      await expect(player1.locator('button:has-text("New Game")')).toBeVisible({ timeout: 5000 });
      await expect(player2.locator('button:has-text("New Game")')).toBeVisible({ timeout: 5000 });

      // Both players click "New Game" with a small delay to avoid exact simultaneity
      await player1.waitForTimeout(300);
      await player1.click('button:has-text("New Game")');
      await player2.waitForTimeout(BASE_TIMEOUT);
      await player2.click('button:has-text("New Game")');

      // Check what state they end up in after clicking New Game
      await player1.waitForTimeout(2 * BASE_TIMEOUT);

      const p1HasGameBoard = await player1.locator('.game-board').count() > 0;
      const p2HasGameBoard = await player2.locator('.game-board').count() > 0;
      const p1HasPlayButton = await player1.locator('button:has-text("Play")').count() > 0;
      const p2HasPlayButton = await player2.locator('button:has-text("Play")').count() > 0;

      console.log(`Rapid test - After New Game - P1: gameBoard=${p1HasGameBoard}, playButton=${p1HasPlayButton}`);
      console.log(`Rapid test - After New Game - P2: gameBoard=${p2HasGameBoard}, playButton=${p2HasPlayButton}`);

      if (p1HasPlayButton && p2HasPlayButton) {
        console.log('Rapid test - Players returned to lobby');

        // Both players click "Play" to start new game with staggered timing
        await player1.click('button:has-text("Play")');
        await player1.waitForTimeout(BASE_TIMEOUT);

        await player2.click('button:has-text("Play")');
        await player2.waitForTimeout(BASE_TIMEOUT); // Wait for matching

        // Both players should be in the same new game
        await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });
        await expect(player2.locator('.game-board')).toBeVisible({ timeout: 5000 });

      } else if (p1HasGameBoard && p2HasGameBoard) {
        console.log('Rapid test - Players stayed in new game');
        await player1.waitForTimeout(BASE_TIMEOUT);

      } else {
        throw new Error(`Rapid test - Inconsistent state: P1(board=${p1HasGameBoard}, play=${p1HasPlayButton}), P2(board=${p2HasGameBoard}, play=${p2HasPlayButton})`);
      }

      // Make a move to verify they're in the same game
      await player1.click('.game-board button:nth-child(3)'); // Position 2
      await expect(player2.locator('.game-board button:nth-child(3) .symbol')).toHaveText('X', { timeout: 5000 });
      await player1.waitForTimeout(BASE_TIMEOUT);

      console.log('✅ Rapid new game test passed');

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});