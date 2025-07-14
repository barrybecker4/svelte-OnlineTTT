import { test, expect } from '@playwright/test';

const BASE_TIMEOUT = 500;

test.describe('New Game History Bug Investigation', () => {
  test('should not inflate game history when clicking New Game', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const player1 = await context1.newPage();
    const player2 = await context2.newPage();

    // Enable console logging to track what's happening
    player1.on('console', msg => console.log('P1:', msg.text()));
    player2.on('console', msg => console.log('P2:', msg.text()));

    try {
      // Setup players
      await player1.goto('/');
      await player1.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'TestPlayer1');
      });
      await player1.reload();
      await player1.waitForTimeout(BASE_TIMEOUT);

      await player2.goto('/');
      await player2.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'TestPlayer2');
      });
      await player2.reload();
      await player2.waitForTimeout(BASE_TIMEOUT);

      console.log('=== GAME 1: Playing a complete game ===');

      // Player 1 creates game
      await player1.click('button:has-text("Play")');
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });
      await player1.waitForTimeout(BASE_TIMEOUT);

      // Player 2 joins
      await player2.click('button:has-text("Play")');
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 5000 });
      await player2.waitForTimeout(BASE_TIMEOUT);

      // Quick game: Player1 wins (X wins with 0,3,6)
      await player1.click('.game-board button:nth-child(1)'); // X at position 0
      await expect(player2.locator('.game-board button:nth-child(1) .symbol')).toHaveText('X', { timeout: 5000 });

      await player2.click('.game-board button:nth-child(2)'); // O at position 1
      await expect(player1.locator('.game-board button:nth-child(2) .symbol')).toHaveText('O', { timeout: 5000 });

      await player1.click('.game-board button:nth-child(4)'); // X at position 3
      await expect(player2.locator('.game-board button:nth-child(4) .symbol')).toHaveText('X', { timeout: 5000 });

      await player2.click('.game-board button:nth-child(5)'); // O at position 4
      await expect(player1.locator('.game-board button:nth-child(5) .symbol')).toHaveText('O', { timeout: 5000 });

      await player1.click('.game-board button:nth-child(7)'); // X at position 6 - wins!
      await expect(player2.locator('.game-board button:nth-child(7) .symbol')).toHaveText('X', { timeout: 5000 });

      // Wait for game to be complete
      await player1.waitForTimeout(1000);
      await expect(player1.locator('button:has-text("New Game")')).toBeVisible({ timeout: 5000 });
      await expect(player2.locator('button:has-text("New Game")')).toBeVisible({ timeout: 5000 });

      console.log('=== CHECKING HISTORY AFTER GAME 1 ===');

      // Check initial history - should show 1 encounter
      const historyAfterGame1P1 = await player1.locator('.player-history').textContent();
      const historyAfterGame1P2 = await player2.locator('.player-history').textContent();

      console.log('P1 History after game 1:', historyAfterGame1P1);
      console.log('P2 History after game 1:', historyAfterGame1P2);

      // Extract encounter count from history text
      const extractEncounterCount = (historyText: string | null): number => {
        if (!historyText) return 0;
        const match = historyText.match(/played.*?(\d+)\s+times?/i);
        return match ? parseInt(match[1]) : 0;
      };

      const encountersAfterGame1P1 = extractEncounterCount(historyAfterGame1P1);
      const encountersAfterGame1P2 = extractEncounterCount(historyAfterGame1P2);

      console.log('Encounters after game 1 - P1:', encountersAfterGame1P1, 'P2:', encountersAfterGame1P2);

      // Should be 1 encounter for both players
      expect(encountersAfterGame1P1).toBe(1);
      expect(encountersAfterGame1P2).toBe(1);

      console.log('=== STARTING NEW GAME ===');

      // Now the critical test: Player 1 clicks "New Game"
      // This should NOT increment the encounter count beyond what's expected
      await player1.click('button:has-text("New Game")');

      // Give time for any WebSocket errors/reconnections to occur
      await player1.waitForTimeout(1000);

      // Player 2 also clicks "New Game"
      await player2.click('button:has-text("New Game")');
      await player2.waitForTimeout(1000);

      console.log('=== CHECKING IF EXTRA GAMES WERE CREATED ===');

      // Both should now either be in lobby or in a new game
      // Let's check if they're in lobby first
      const p1InLobby = await player1.locator('button:has-text("Play")').isVisible();
      const p2InLobby = await player2.locator('button:has-text("Play")').isVisible();

      if (p1InLobby && p2InLobby) {
        console.log('Both players returned to lobby, starting fresh game');

        // Start a second game to see the history
        await player1.click('button:has-text("Play")');
        await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });
        await player1.waitForTimeout(BASE_TIMEOUT);

        await player2.click('button:has-text("Play")');
        await expect(player2.locator('.game-board')).toBeVisible({ timeout: 5000 });
        await player2.waitForTimeout(BASE_TIMEOUT);
      }

      // Now check history again - this is the key test
      const historyAfterNewGameP1 = await player1.locator('.player-history').textContent();
      const historyAfterNewGameP2 = await player2.locator('.player-history').textContent();

      console.log('P1 History after new game:', historyAfterNewGameP1);
      console.log('P2 History after new game:', historyAfterNewGameP2);

      const encountersAfterNewGameP1 = extractEncounterCount(historyAfterNewGameP1);
      const encountersAfterNewGameP2 = extractEncounterCount(historyAfterNewGameP2);

      console.log('Encounters after new game - P1:', encountersAfterNewGameP1, 'P2:', encountersAfterNewGameP2);

      // THIS IS THE BUG: These should still be 1, but are likely higher
      console.log('=== TESTING FOR BUG ===');
      console.log(`Expected encounters: 1, Actual P1: ${encountersAfterNewGameP1}, P2: ${encountersAfterNewGameP2}`);

      // Let's be generous and check if it's more than expected
      if (encountersAfterNewGameP1 > 1 || encountersAfterNewGameP2 > 1) {
        console.log('🚨 BUG DETECTED: Extra games were created during New Game transition!');
        console.log(`P1 has ${encountersAfterNewGameP1} encounters, P2 has ${encountersAfterNewGameP2} encounters`);

        // This test will intentionally fail to highlight the bug
        expect(encountersAfterNewGameP1).toBe(1);
        expect(encountersAfterNewGameP2).toBe(1);
      } else {
        console.log('✅ No extra games detected - New Game works correctly');
        expect(encountersAfterNewGameP1).toBe(1);
        expect(encountersAfterNewGameP2).toBe(1);
      }

    } catch (error) {
      console.error('Test failed:', error);

      // Capture additional debugging info on failure
      try {
        const p1GameState = await player1.evaluate(() => {
          // Try to get any game state info from the page
          const gameBoard = document.querySelector('.game-board');
          const history = document.querySelector('.player-history');
          const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
          return { hasGameBoard: !!gameBoard, historyText: history?.textContent, buttons };
        });

        const p2GameState = await player2.evaluate(() => {
          const gameBoard = document.querySelector('.game-board');
          const history = document.querySelector('.player-history');
          const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
          return { hasGameBoard: !!gameBoard, historyText: history?.textContent, buttons };
        });

        console.log('P1 final state:', JSON.stringify(p1GameState, null, 2));
        console.log('P2 final state:', JSON.stringify(p2GameState, null, 2));
      } catch (debugError) {
        console.log('Could not capture debug state:', debugError);
      }

      throw error;
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should track exact API calls during New Game transition', async ({ browser }) => {
    const context1 = await browser.newContext();
    const player1 = await context1.newPage();

    // Track all network requests
    const apiCalls: { url: string; method: string; timestamp: number }[] = [];

    player1.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
        console.log(`API Call: ${request.method()} ${request.url()}`);
      }
    });

    try {
      await player1.goto('/');
      await player1.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'TestPlayer1');
      });
      await player1.reload();
      await player1.waitForTimeout(BASE_TIMEOUT);

      console.log('=== Starting API tracking test ===');

      // Clear previous calls
      apiCalls.length = 0;

      // Create first game
      await player1.click('button:has-text("Play")');
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });
      await player1.waitForTimeout(1000);

      const callsAfterFirstGame = [...apiCalls];
      console.log('API calls after first game:', callsAfterFirstGame);

      // Click New Game
      apiCalls.length = 0; // Reset tracking
      await player1.click('button:has-text("New Game")');
      await player1.waitForTimeout(2000); // Give time for all async operations

      console.log('API calls during New Game transition:');
      apiCalls.forEach((call, index) => {
        console.log(`  ${index + 1}. ${call.method} ${call.url}`);
      });

      // Analyze the calls
      const gameCreationCalls = apiCalls.filter(call => call.url.includes('/api/game/new'));
      const quitCalls = apiCalls.filter(call => call.url.includes('/quit'));
      const moveCalls = apiCalls.filter(call => call.url.includes('/move'));
      const historyCalls = apiCalls.filter(call => call.url.includes('/api/history'));

      console.log(`New game calls: ${gameCreationCalls.length}`);
      console.log(`Quit calls: ${quitCalls.length}`);
      console.log(`Move calls: ${moveCalls.length}`);
      console.log(`History calls: ${historyCalls.length}`);

      // Expectation: Should be exactly 1 quit call and 1 new game call
      expect(quitCalls.length).toBe(1);
      expect(gameCreationCalls.length).toBe(1);

    } finally {
      await context1.close();
    }
  });
});
