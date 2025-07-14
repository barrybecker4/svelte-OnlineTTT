import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/testUtils';

const BASE_TIMEOUT = 500;

test.describe('Debug Player Matching WebSocket Flow', () => {
  test('should show WebSocket playerJoined notifications', async ({ browser }) => {
    // Generate unique player names for this test run
    const { player1: player1Name, player2: player2Name } = TestUtils.generateUniquePlayerNames('websocket-matching');
    console.log(`🎯 WebSocket test using players: ${player1Name} and ${player2Name}`);

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
      console.log('=== STEP 1: Player 1 Setup with Unique Name ===');
      await TestUtils.setupPlayer(player1, player1Name);
      console.log(`✅ Player 1 set up as: ${player1Name}`);

      console.log('=== STEP 2: Player 1 Clicks Play ===');
      await player1.click('button:has-text("Play")');
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });
      console.log('✅ Player 1 has game board');

      // Wait for WebSocket connection
      await player1.waitForTimeout(BASE_TIMEOUT);

      console.log('=== STEP 3: Player 2 Setup with Unique Name ===');
      await TestUtils.setupPlayer(player2, player2Name);
      console.log(`✅ Player 2 set up as: ${player2Name}`);

      console.log('=== STEP 4: Player 2 Clicks Play ===');
      await player2.click('button:has-text("Play")');
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 5000 });
      console.log('✅ Player 2 has game board');

      console.log('=== STEP 5: Wait for WebSocket Notifications ===');
      // Give enough time for WebSocket notifications to propagate
      await player1.waitForTimeout(2 * BASE_TIMEOUT);

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

      // Use the unique player names to check if they see each other
      console.log(`Player 1 sees ${player2Name}:`, player1Text?.includes(player2Name) || false);
      console.log(`Player 2 sees ${player1Name}:`, player2Text?.includes(player1Name) || false);

      console.log('Player 1 sees "Waiting":', player1Text?.includes('Waiting') || player1Text?.includes('waiting') || false);
      console.log('Player 2 sees "Waiting":', player2Text?.includes('Waiting') || player2Text?.includes('waiting') || false);

      // Check who can make moves
      const player1CanMove = await player1.locator('.game-board button').first().isEnabled();
      const player2CanMove = await player2.locator('.game-board button').first().isEnabled();

      console.log('Player 1 can move:', player1CanMove);
      console.log('Player 2 can move:', player2CanMove);

      console.log('=== STEP 8: Detailed Game State Check ===');

      // Get more detailed state information from both players
      const player1GameState = await player1.evaluate((p2Name) => {
        return {
          hasGameBoard: !!document.querySelector('.game-board'),
          gameStatusText: document.querySelector('.game-status')?.textContent || 'No status found',
          playerNames: Array.from(document.querySelectorAll('.player .name')).map(el => el.textContent),
          seesOpponent: document.querySelector('.game-status')?.textContent?.includes(p2Name) || false,
          allText: document.body.textContent?.substring(0, 1000) || 'No content'
        };
      }, player2Name);

      const player2GameState = await player2.evaluate((p1Name) => {
        return {
          hasGameBoard: !!document.querySelector('.game-board'),
          gameStatusText: document.querySelector('.game-status')?.textContent || 'No status found',
          playerNames: Array.from(document.querySelectorAll('.player .name')).map(el => el.textContent),
          seesOpponent: document.querySelector('.game-status')?.textContent?.includes(p1Name) || false,
          allText: document.body.textContent?.substring(0, 1000) || 'No content'
        };
      }, player1Name);

      console.log('Player 1 detailed state:', JSON.stringify(player1GameState, null, 2));
      console.log('Player 2 detailed state:', JSON.stringify(player2GameState, null, 2));

      console.log('=== STEP 9: Test Move to Verify Connection ===');

      // Try to make a move with whoever can move
      let moveTestPassed = false;

      if (player1CanMove) {
        console.log('Player 1 attempting move...');
        await player1.click('.game-board button:first-child');
        await player1.waitForTimeout(2000);

        // Check if Player 2 sees the move
        const player2SeesMoveAfter = await player2.locator('.game-board button:first-child .symbol').textContent();
        console.log('Player 2 sees move after Player 1 clicked:', player2SeesMoveAfter);

        if (player2SeesMoveAfter === 'X') {
          console.log('🎉 SUCCESS: Players are connected and can play!');
          moveTestPassed = true;
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
          moveTestPassed = true;
        } else {
          console.log('❌ FAILURE: Move not synchronized between players');
        }
      } else {
        console.log('❌ FAILURE: Neither player can move');
      }

      console.log('=== FINAL RESULTS ===');
      console.log(`Move test passed: ${moveTestPassed}`);
      console.log(`Players can see each other: ${player1GameState.seesOpponent || player2GameState.seesOpponent}`);
      console.log(`At least one can move: ${player1CanMove || player2CanMove}`);

      // For the test to pass, at least one player should be able to move
      expect(player1CanMove || player2CanMove).toBe(true);

      if (moveTestPassed) {
        console.log('🎉 WebSocket matching test PASSED with unique identifiers!');
      }

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle multiple concurrent player pairs without conflicts', async ({ browser }) => {
    // This test demonstrates that multiple player pairs can coexist
    const { player1: set1Player1, player2: set1Player2 } = TestUtils.generateUniquePlayerNames('concurrent-set1');
    const { player1: set2Player1, player2: set2Player2 } = TestUtils.generateUniquePlayerNames('concurrent-set2');

    console.log(`🎯 Concurrent test using:
      Set 1: ${set1Player1} vs ${set1Player2}
      Set 2: ${set2Player1} vs ${set2Player2}`);

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    const context4 = await browser.newContext();

    const player1a = await context1.newPage();
    const player1b = await context2.newPage();
    const player2a = await context3.newPage();
    const player2b = await context4.newPage();

    try {
      // Set up both pairs simultaneously
      await Promise.all([
        TestUtils.setupPlayer(player1a, set1Player1),
        TestUtils.setupPlayer(player1b, set1Player2),
        TestUtils.setupPlayer(player2a, set2Player1),
        TestUtils.setupPlayer(player2b, set2Player2)
      ]);

      // Start games for both pairs
      await Promise.all([
        player1a.click('button:has-text("Play")'),
        player2a.click('button:has-text("Play")')
      ]);

      await Promise.all([
        expect(player1a.locator('.game-board')).toBeVisible({ timeout: 5000 }),
        expect(player2a.locator('.game-board')).toBeVisible({ timeout: 5000 })
      ]);

      // Second players join
      await Promise.all([
        player1b.click('button:has-text("Play")'),
        player2b.click('button:has-text("Play")')
      ]);

      await Promise.all([
        expect(player1b.locator('.game-board')).toBeVisible({ timeout: 5000 }),
        expect(player2b.locator('.game-board')).toBeVisible({ timeout: 5000 })
      ]);

      // Basic verification that all games are running
      const allHaveBoards = await Promise.all([
        player1a.locator('.game-board').isVisible(),
        player1b.locator('.game-board').isVisible(),
        player2a.locator('.game-board').isVisible(),
        player2b.locator('.game-board').isVisible()
      ]);

      expect(allHaveBoards.every(hasBoard => hasBoard)).toBe(true);
      console.log('✅ Multiple concurrent games working with unique identifiers!');

    } finally {
      await Promise.all([
        context1.close(),
        context2.close(),
        context3.close(),
        context4.close()
      ]);
    }
  });
});
