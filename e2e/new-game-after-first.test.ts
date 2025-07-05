import { test, expect } from '@playwright/test';

test.describe('New Game After First Game Completion', () => {
  test('should create one new game when both players click New Game after game completion', async ({ browser }) => {
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
      await player1.waitForTimeout(1000);

      await player2.goto('/');
      await player2.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'Player2');
      });
      await player2.reload();
      await player2.waitForTimeout(1000);

      // Player 1 creates a game
      await player1.click('button:has-text("Play")');

      // Player 2 joins the game
      await player2.click('button:has-text("Play")');

      // Wait for both players to be connected
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 10000 });

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

      // Wait for game completion message on both clients
      await expect(player1.locator('text=Player1 wins!')).toBeVisible({ timeout: 5000 });
      await expect(player2.locator('text=Player1 wins!')).toBeVisible({ timeout: 5000 });

      // Both players click "New Game"
      await player1.click('button:has-text("New Game")');
      await player2.click('button:has-text("New Game")');

      // Wait for the new game to start
      // Both players should be in the same new game
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 10000 });

      // Verify they're in the same game by checking that both can see an empty board
      await expect(player1.locator('.game-board button:nth-child(1)')).toBeVisible({ timeout: 5000 });
      await expect(player2.locator('.game-board button:nth-child(1)')).toBeVisible({ timeout: 5000 });

      // Verify that player1 can make a move and player2 sees it (confirming same game)
      await player1.click('.game-board button:nth-child(5)'); // X in center (position 4)
      await expect(player2.locator('.game-board button:nth-child(5) .symbol')).toHaveText('X', { timeout: 5000 });

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
      await player1.waitForTimeout(1000);

      await player2.goto('/');
      await player2.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'Player2');
      });
      await player2.reload();
      await player2.waitForTimeout(1000);

      // Player 1 creates a game
      await player1.click('button:has-text("Play")');

      // Player 2 joins the game
      await player2.click('button:has-text("Play")');

      // Wait for both players to be connected
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 10000 });

      // Quickly finish a game
      await player1.click('.game-board button:nth-child(1)'); // X (position 0)
      await player2.click('.game-board button:nth-child(2)'); // O (position 1)
      await player1.click('.game-board button:nth-child(4)'); // X (position 3)
      await player2.click('.game-board button:nth-child(5)'); // O (position 4)
      await player1.click('.game-board button:nth-child(7)'); // X wins (0,3,6)

      // Wait for game completion
      await expect(player1.locator('text=Player1 wins!')).toBeVisible({ timeout: 5000 });

      // Both players click "New Game" almost simultaneously
      await Promise.all([
        player1.click('button:has-text("New Game")'),
        player2.click('button:has-text("New Game")')
      ]);

      // Wait a moment for the backend to process
      await player1.waitForTimeout(2000);

      // Both players should be in the same new game
      await expect(player1.locator('text=Player2')).toBeVisible({ timeout: 10000 });
      await expect(player2.locator('text=Player1')).toBeVisible({ timeout: 10000 });

      // Make a move to verify they're in the same game
      await player1.click('.game-board button:nth-child(3)'); // Position 2
      await expect(player2.locator('.game-board button:nth-child(3) .symbol')).toHaveText('X', { timeout: 5000 });

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
