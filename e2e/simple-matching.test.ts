import { test, expect } from '@playwright/test';

test.describe('Debug Player Matching WebSocket Flow', () => {
  test('should show WebSocket playerJoined notifications', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const player1 = await context1.newPage();
    const player2 = await context2.newPage();

    // Capture console logs specifically for WebSocket notifications
    const player1Logs: string[] = [];
    const player2Logs: string[] = [];

    player1.on('console', msg => {
      const text = msg.text();
      player1Logs.push(`[P1]: ${text}`);
      if (text.includes('playerJoined') || text.includes('Player joined') || text.includes('👋')) {
        console.log(`🟢 [PLAYER1 NOTIFICATION]:`, text);
      }
    });

    player2.on('console', msg => {
      const text = msg.text();
      player2Logs.push(`[P2]: ${text}`);
      if (text.includes('playerJoined') || text.includes('Player joined') || text.includes('👋')) {
        console.log(`🟢 [PLAYER2 NOTIFICATION]:`, text);
      }
    });

    try {
      console.log('=== STEP 1: Player 1 Setup ===');
      await player1.goto('/');
      await player1.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'TestPlayer1');
      });
      await player1.reload();
      await player1.waitForTimeout(2000);

      console.log('=== STEP 2: Player 1 Clicks Play ===');
      await player1.click('button:has-text("Play")');
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 10000 });
      console.log('✅ Player 1 has game board');

      // Wait for WebSocket connection
      await player1.waitForTimeout(3000);

      console.log('=== STEP 3: Player 2 Setup ===');
      await player2.goto('/');
      await player2.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'TestPlayer2');
      });
      await player2.reload();
      await player2.waitForTimeout(2000);

      console.log('=== STEP 4: Player 2 Clicks Play ===');
      await player2.click('button:has-text("Play")');
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 10000 });
      console.log('✅ Player 2 has game board');

      console.log('=== STEP 5: Wait for WebSocket Notifications ===');
      // Give enough time for WebSocket notifications to propagate
      await player1.waitForTimeout(5000);

      console.log('=== STEP 6: Check for WebSocket Notification Logs ===');

      // Look for playerJoined notifications in Player 1's logs
      const player1NotificationLogs = player1Logs.filter(log =>
        log.includes('playerJoined') ||
        log.includes('Player joined') ||
        log.includes('👋') ||
        log.includes('Received game message: playerJoined') ||
        log.includes('Player joined notification received')
      );

      const player2NotificationLogs = player2Logs.filter(log =>
        log.includes('playerJoined') ||
        log.includes('Player joined') ||
        log.includes('👋') ||
        log.includes('Received game message: playerJoined') ||
        log.includes('Player joined notification received')
      );

      console.log('Player 1 notification logs:', player1NotificationLogs);
      console.log('Player 2 notification logs:', player2NotificationLogs);

      console.log('=== STEP 7: Check UI State ===');

      // Check current text content to see what each player sees
      const player1Text = await player1.textContent('body');
      const player2Text = await player2.textContent('body');

      console.log('Player 1 sees TestPlayer2:', player1Text?.includes('TestPlayer2') || false);
      console.log('Player 2 sees TestPlayer1:', player2Text?.includes('TestPlayer1') || false);

      console.log('Player 1 sees "Waiting":', player1Text?.includes('Waiting') || player1Text?.includes('waiting') || false);
      console.log('Player 2 sees "Waiting":', player2Text?.includes('Waiting') || player2Text?.includes('waiting') || false);

      // Check who can make moves
      const player1CanMove = await player1.locator('.game-board button').first().isEnabled();
      const player2CanMove = await player2.locator('.game-board button').first().isEnabled();

      console.log('Player 1 can move:', player1CanMove);
      console.log('Player 2 can move:', player2CanMove);

      console.log('=== STEP 8: Detailed Game State Check ===');

      // Get more detailed state information from both players
      const player1GameState = await player1.evaluate(() => {
        // Try to access the game state from the window if it's exposed for debugging
        return {
          hasGameBoard: !!document.querySelector('.game-board'),
          gameStatusText: document.querySelector('.game-status')?.textContent || 'No status found',
          playerNames: Array.from(document.querySelectorAll('.player .name')).map(el => el.textContent),
          allText: document.body.textContent?.substring(0, 1000) || 'No content'
        };
      });

      const player2GameState = await player2.evaluate(() => {
        return {
          hasGameBoard: !!document.querySelector('.game-board'),
          gameStatusText: document.querySelector('.game-status')?.textContent || 'No status found',
          playerNames: Array.from(document.querySelectorAll('.player .name')).map(el => el.textContent),
          allText: document.body.textContent?.substring(0, 1000) || 'No content'
        };
      });

      console.log('Player 1 detailed state:', JSON.stringify(player1GameState, null, 2));
      console.log('Player 2 detailed state:', JSON.stringify(player2GameState, null, 2));

      console.log('=== STEP 9: Test Move to Verify Connection ===');

      // Try to make a move with whoever can move
      if (player1CanMove) {
        console.log('Player 1 attempting move...');
        await player1.click('.game-board button:first-child');
        await player1.waitForTimeout(2000);

        // Check if Player 2 sees the move
        const player2SeesMoveAfter = await player2.locator('.game-board button:first-child .symbol').textContent();
        console.log('Player 2 sees move after Player 1 clicked:', player2SeesMoveAfter);

        if (player2SeesMoveAfter === 'X') {
          console.log('🎉 SUCCESS: Players are connected and can play!');
        } else {
          console.log('❌ FAILURE: Move not synchronized between players');
        }
      } else if (player2CanMove) {
        console.log('Player 2 attempting move...');
        await player2.click('.game-board button:first-child');
        await player2.waitForTimeout(2000);

        // Check if Player 1 sees the move
        const player1SeesMoveAfter = await player1.locator('.game-board button:first-child .symbol').textContent();
        console.log('Player 1 sees move after Player 2 clicked:', player1SeesMoveAfter);

        if (player1SeesMoveAfter && player1SeesMoveAfter.match(/[XO]/)) {
          console.log('🎉 SUCCESS: Players are connected and can play!');
        } else {
          console.log('❌ FAILURE: Move not synchronized between players');
        }
      } else {
        console.log('❌ FAILURE: Neither player can move');
      }

      // For the test to pass, at least one player should be able to move
      expect(player1CanMove || player2CanMove).toBe(true);

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
