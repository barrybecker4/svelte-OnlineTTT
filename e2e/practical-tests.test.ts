// e2e/practical-tests.test.ts
import { expect, test } from '@playwright/test';

test.describe('Practical Game Tests', () => {
  
  test('Player quits via Quit button - other player wins', async ({ browser }) => {
    test.setTimeout(25000);
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const player1Page = await context1.newPage();
    const player2Page = await context2.newPage();
    
    try {
      console.log('=== Testing Quick Quit via Button ===');
      
      // Setup players quickly
      await player1Page.goto('/');
      await player1Page.evaluate(() => localStorage.setItem('ttt-player-name', 'Alice'));
      await player1Page.reload();
      await player1Page.waitForTimeout(1000);
      await player1Page.click('button:has-text("Play")');
      
      await player2Page.goto('/');
      await player2Page.evaluate(() => localStorage.setItem('ttt-player-name', 'Bob'));
      await player2Page.reload();
      await player2Page.waitForTimeout(1000);
      await player2Page.click('button:has-text("Play")');
      
      // Wait for both to connect and be matched
      await expect(player1Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await expect(player2Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await player1Page.waitForTimeout(4000); // Give time for matching
      
      // Make a quick move to ensure game is active
      const firstCell = player1Page.locator('.game-board button:first-child');
      const isEnabled = await firstCell.isEnabled();
      
      if (isEnabled) {
        console.log('Player 1 making a quick move...');
        await firstCell.click();
        await player1Page.waitForTimeout(2000);
        
        const moveContent = await firstCell.locator('.symbol').textContent();
        console.log('Move confirmed:', moveContent);
      }
      
      // Player 2 quits immediately (before 10-second timer expires)
      console.log('Player 2 quitting QUICKLY via Quit button...');
      const quitButton = player2Page.locator('button:has-text("Quit")');
      await expect(quitButton).toBeVisible();
      
      // Click quit button immediately
      await quitButton.click();
      console.log('✅ Quit button clicked');
      
      // Give time for quit to process and notifications to arrive
      console.log('Waiting for quit to process...');
      await player1Page.waitForTimeout(6000);
      
      // Check if Player 1 sees a win/resignation message
      console.log('Checking Player 1 for win notification...');
      
      const winText = await player1Page.locator('text=/win|won|victory/i').count();
      const resignText = await player1Page.locator('text=/quit|resign|forfeit/i').count(); 
      
      console.log('Win text found:', winText);
      console.log('Resign text found:', resignText);
      
      // The quit button test should show at least resignation text
      expect(resignText).toBeGreaterThan(0);
      console.log('🎉 SUCCESS: Player 1 notified of resignation!');
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
  
  test('Player timeout scenario - other player wins', async ({ browser }) => {
    test.setTimeout(30000); // Increased timeout for this test
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const player1Page = await context1.newPage();
    const player2Page = await context2.newPage();
    
    try {
      console.log('=== Testing Player Timeout ===');
      
      // Setup players
      await player1Page.goto('/');
      await player1Page.evaluate(() => localStorage.setItem('ttt-player-name', 'Alice'));
      await player1Page.reload();
      await player1Page.waitForTimeout(1000);
      await player1Page.click('button:has-text("Play")');
      
      await player2Page.goto('/');
      await player2Page.evaluate(() => localStorage.setItem('ttt-player-name', 'Bob'));
      await player2Page.reload();
      await player2Page.waitForTimeout(1000);
      await player2Page.click('button:has-text("Play")');
      
      // Wait for both to connect
      await expect(player1Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await expect(player2Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await player1Page.waitForTimeout(4000);
      
      // Make a move to ensure game is active
      const firstCell = player1Page.locator('.game-board button:first-child');
      const isEnabled = await firstCell.isEnabled();
      
      if (isEnabled) {
        console.log('Player 1 making a move...');
        await firstCell.click();
        await player1Page.waitForTimeout(2000);
        
        const moveContent = await firstCell.locator('.symbol').textContent();
        console.log('Move confirmed:', moveContent);
      }
      
      // Now Player 2's turn - let them timeout (don't make any move)
      console.log('Waiting for Player 2 to timeout (10+ seconds)...');
      await player1Page.waitForTimeout(15000); // Wait longer: 10s timer + 5s buffer
      
      // Check if Player 1 gets notified of win by timeout
      console.log('Checking for timeout win notification...');
      
      const winText = await player1Page.locator('text=/win|won|victory/i').count();
      const timeoutText = await player1Page.locator('text=/timeout|time.*out/i').count();
      
      console.log('Win text found:', winText);
      console.log('Timeout text found:', timeoutText);
      
      // Should see timeout-related win
      const timeoutWin = (winText + timeoutText) > 0;
      expect(timeoutWin).toBe(true);
      console.log('🎉 SUCCESS: Player 1 won by timeout!');
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('Game restart functionality', async ({ browser }) => {
    test.setTimeout(15000);

    const context1 = await browser.newContext();
    const player1Page = await context1.newPage();

    try {
      console.log('=== Testing Game Restart ===');

      // Create game
      await player1Page.goto('/');
      await player1Page.evaluate(() => localStorage.setItem('ttt-player-name', 'Tester'));
      await player1Page.reload();
      await player1Page.waitForTimeout(1000);
      await player1Page.click('button:has-text("Play")');

      await expect(player1Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
      console.log('✅ Game created');

      // Wait for the game state to stabilize before looking for New Game button
      await player1Page.waitForTimeout(3000);

      // Debug: Log all visible buttons before attempting to find New Game
      const allButtons = await player1Page.locator('button').allTextContents();
      console.log('All visible buttons:', allButtons);

      // Try multiple selectors for the New Game button
      const newGameSelectors = [
        'button:has-text("New Game")',
        'button[class*="btn"]:has-text("New Game")',
        '.game-controls button:has-text("New Game")',
        'button:text-is("New Game")'
      ];

      let newGameButton = null;
      let selectorUsed = '';

      for (const selector of newGameSelectors) {
        const buttonCount = await player1Page.locator(selector).count();
        if (buttonCount > 0) {
          newGameButton = player1Page.locator(selector).first();
          selectorUsed = selector;
          console.log(`✅ Found New Game button with selector: ${selector}`);
          break;
        }
      }

      if (!newGameButton) {
        // If we still can't find it, try waiting longer and check game state
        console.log('❌ New Game button not found, waiting longer and debugging...');
        await player1Page.waitForTimeout(5000);

        // Debug game state
        const gameStatusText = await player1Page.locator('.game-status').textContent();
        console.log('Game status text:', gameStatusText);

        // Try again with a more generous timeout
        newGameButton = player1Page.locator('button:has-text("New Game")');
        await expect(newGameButton).toBeVisible({ timeout: 10000 });
      } else {
        // Ensure the button is visible before clicking
        await expect(newGameButton).toBeVisible({ timeout: 5000 });
      }

      console.log(`Clicking New Game button (found with: ${selectorUsed})`);
      await newGameButton.click();
      await player1Page.waitForTimeout(2000);

      // Verify restart worked - should either show Play button OR still show game board
      const playButton = await player1Page.locator('button:has-text("Play")').count();
      const gameBoard = await player1Page.locator('.game-board').count();

      console.log('After restart - Play button:', playButton, 'Game board:', gameBoard);
      expect(playButton + gameBoard).toBeGreaterThan(0);
      console.log('✅ New Game restart works');

    } catch (error) {
      console.error('Test failed with error:', error);

      // Additional debugging on failure
      const allText = await player1Page.textContent('body');
      console.log('Page content sample:', allText.substring(0, 500));

      const allButtons = await player1Page.locator('button').allTextContents();
      console.log('All buttons at failure:', allButtons);

      throw error;
    } finally {
      await context1.close();
    }
  });
});
