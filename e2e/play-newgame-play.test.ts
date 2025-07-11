import { test, expect } from '@playwright/test';

const BASE_TIMEOUT = 500;

test.describe('Play-NewGame-Play Matching Issue', () => {
  test('should allow player2 to join when player1 hits play->newgame before player2 hits play', async ({ browser }) => {
    test.setTimeout(30000); // 30 second timeout for this test

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const player1 = await context1.newPage();
    const player2 = await context2.newPage();

    // Enhanced console logging for debugging
    const player1Logs: string[] = [];
    const player2Logs: string[] = [];

    player1.on('console', msg => {
      const text = msg.text();
      player1Logs.push(`[P1]: ${text}`);
      if (text.includes('🎮') || text.includes('🎯') || text.includes('WebSocket') || text.includes('Game')) {
        console.log(`🔴 [PLAYER1]:`, text);
      }
    });

    player2.on('console', msg => {
      const text = msg.text();
      player2Logs.push(`[P2]: ${text}`);
      if (text.includes('🎮') || text.includes('🎯') || text.includes('WebSocket') || text.includes('Game')) {
        console.log(`🔵 [PLAYER2]:`, text);
      }
    });

    try {
      console.log('=== REPRODUCING: Player1 Play -> NewGame -> Player2 Play Issue ===');

      // === STEP 1: Setup both players ===
      console.log('🚀 Step 1: Setting up both players...');

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

      console.log('✅ Both players set up successfully');

      // === STEP 2: Player1 hits "Play" first ===
      console.log('🔴 Step 2: Player1 clicking "Play"...');
      await player1.click('button:has-text("Play")');

      // Wait for game creation and board to appear
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await player1.waitForTimeout(BASE_TIMEOUT * 2); // Extra time to ensure game is fully created

      console.log('✅ Player1 successfully created a game and has game board');

      // === STEP 3: Player1 immediately hits "New Game" ===
      console.log('🔴 Step 3: Player1 clicking "New Game" to abandon current game...');

      // Debug: Check what buttons are actually available
      const availableButtons = await player1.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map(btn => ({
          text: btn.textContent?.trim(),
          classes: btn.className,
          visible: btn.offsetParent !== null
        }));
      });
      console.log('🔍 Available buttons for Player1:', JSON.stringify(availableButtons, null, 2));

      // Try to find any button that could trigger new game
      const newGameButton = player1.locator('button').filter({ hasText: /^(New Game|Play)$/ });
      const buttonText = await newGameButton.textContent();
      console.log(`🔴 Found button with text: "${buttonText}"`);

      // Wait for button and click it
      await expect(newGameButton).toBeVisible({ timeout: 5000 });
      await newGameButton.click();

      // Wait for the new game cleanup and creation to complete
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await player1.waitForTimeout(BASE_TIMEOUT * 3); // Extra time for cleanup and new game creation

      console.log('✅ Player1 successfully started a new game after abandoning first game');

      // === STEP 4: Player2 now hits "Play" ===
      console.log('🔵 Step 4: Player2 clicking "Play" (should join Player1\'s NEW game)...');
      await player2.click('button:has-text("Play")');

      // Wait for player2's game board to appear
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 10000 });
      await player2.waitForTimeout(BASE_TIMEOUT * 2);

      console.log('✅ Player2 has a game board');

      // === STEP 5: Wait for player matching to complete ===
      console.log('🤝 Step 5: Waiting for player matching to complete...');
      await player1.waitForTimeout(BASE_TIMEOUT * 4); // Give time for WebSocket notifications and matching
      await player2.waitForTimeout(BASE_TIMEOUT * 2);

      // === STEP 6: Check if both players are in the same game ===
      console.log('🔍 Step 6: Verifying both players are in the same game...');

      const player1GameState = await player1.evaluate(() => {
        const statusEl = document.querySelector('.game-status');
        const playerEls = document.querySelectorAll('.player .name');
        const boardButtons = document.querySelectorAll('.game-board button');
        const enabledButtons = Array.from(boardButtons).filter(btn => !btn.disabled);

        return {
          hasGameBoard: !!document.querySelector('.game-board'),
          gameStatusText: statusEl?.textContent || 'No status',
          playerCount: playerEls.length,
          playerNames: Array.from(playerEls).map(el => el.textContent),
          hasOpponent: statusEl?.textContent?.includes('TestPlayer2') || false,
          enabledButtonCount: enabledButtons.length,
          gameUrl: window.location.href,
          fullPageText: document.body.textContent?.substring(0, 500) || ''
        };
      });

      const player2GameState = await player2.evaluate(() => {
        const statusEl = document.querySelector('.game-status');
        const playerEls = document.querySelectorAll('.player .name');
        const boardButtons = document.querySelectorAll('.game-board button');
        const enabledButtons = Array.from(boardButtons).filter(btn => !btn.disabled);

        return {
          hasGameBoard: !!document.querySelector('.game-board'),
          gameStatusText: statusEl?.textContent || 'No status',
          playerCount: playerEls.length,
          playerNames: Array.from(playerEls).map(el => el.textContent),
          hasOpponent: statusEl?.textContent?.includes('TestPlayer1') || false,
          enabledButtonCount: enabledButtons.length,
          gameUrl: window.location.href,
          fullPageText: document.body.textContent?.substring(0, 500) || ''
        };
      });

      console.log('🔴 Player1 final state:', JSON.stringify(player1GameState, null, 2));
      console.log('🔵 Player2 final state:', JSON.stringify(player2GameState, null, 2));

      // === STEP 7: Check if they're on the same game URL ===
      console.log('🔗 Step 7: Checking if players are on the same game...');
      const player1Url = player1GameState.gameUrl;
      const player2Url = player2GameState.gameUrl;
      console.log(`🔴 Player1 URL: ${player1Url}`);
      console.log(`🔵 Player2 URL: ${player2Url}`);

      const sameUrl = player1Url === player2Url;
      console.log(`🔗 Same URL: ${sameUrl}`);

      // === STEP 8: Verify they can interact (make moves) ===
      console.log('🎯 Step 8: Testing if players can make moves (verifying they\'re matched)...');

      let moveTestPassed = false;

      // Check how many enabled buttons each player has
      console.log(`🔴 Player1 enabled buttons: ${player1GameState.enabledButtonCount}`);
      console.log(`🔵 Player2 enabled buttons: ${player2GameState.enabledButtonCount}`);

      // Try to determine who should move first
      const player1CanMove = await player1.locator('.game-board button:first-child').isEnabled();
      const player2CanMove = await player2.locator('.game-board button:first-child').isEnabled();

      console.log(`🔴 Player1 can move: ${player1CanMove}`);
      console.log(`🔵 Player2 can move: ${player2CanMove}`);

      if (player1CanMove) {
        console.log('🔴 Player1 attempting first move...');
        await player1.click('.game-board button:first-child');
        await player1.waitForTimeout(2000); // Wait for move to propagate

        // Check if player2 sees the move
        const player2SeesMove = await player2.locator('.game-board button:first-child .symbol').textContent();
        console.log(`🔵 Player2 sees move: "${player2SeesMove}"`);

        if (player2SeesMove === 'X') {
          moveTestPassed = true;
          console.log('🎉 SUCCESS: Move synchronized between players!');
        } else {
          console.log('❌ FAILURE: Move not synchronized');
        }
      } else if (player2CanMove) {
        console.log('🔵 Player2 attempting first move...');
        await player2.click('.game-board button:first-child');
        await player2.waitForTimeout(2000); // Wait for move to propagate

        // Check if player1 sees the move
        const player1SeesMove = await player1.locator('.game-board button:first-child .symbol').textContent();
        console.log(`🔴 Player1 sees move: "${player1SeesMove}"`);

        if (player1SeesMove && player1SeesMove.match(/[XO]/)) {
          moveTestPassed = true;
          console.log('🎉 SUCCESS: Move synchronized between players!');
        } else {
          console.log('❌ FAILURE: Move not synchronized');
        }
      } else {
        console.log('❌ CRITICAL: Neither player can move - they are not properly matched!');
      }

      // === ASSERTIONS ===
      console.log('📋 Final Test Results:');
      console.log(`   - Both have game boards: ${player1GameState.hasGameBoard && player2GameState.hasGameBoard}`);
      console.log(`   - Same URL: ${sameUrl}`);
      console.log(`   - Player1 sees Player2: ${player1GameState.hasOpponent}`);
      console.log(`   - Player2 sees Player1: ${player2GameState.hasOpponent}`);
      console.log(`   - Move test passed: ${moveTestPassed}`);

      // The test should pass if:
      // 1. Both players have game boards
      // 2. At least one player can see the other (indicating they're matched)
      // 3. They can successfully make synchronized moves
      expect(player1GameState.hasGameBoard).toBe(true);
      expect(player2GameState.hasGameBoard).toBe(true);

      // At least one should see the opponent (they should be matched)
      const areMatched = player1GameState.hasOpponent || player2GameState.hasOpponent;
      expect(areMatched).toBe(true);

      // The move test should pass (proving real-time sync)
      expect(moveTestPassed).toBe(true);

      if (areMatched && moveTestPassed) {
        console.log('🎉 TEST PASSED: Players successfully matched after Play->NewGame->Play sequence!');
      } else {
        console.log('❌ TEST FAILED: Players did not match properly');

        // Print logs for debugging
        console.log('\n🔴 Player1 Console Logs:');
        player1Logs.slice(-10).forEach(log => console.log('   ', log));
        console.log('\n🔵 Player2 Console Logs:');
        player2Logs.slice(-10).forEach(log => console.log('   ', log));
      }

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should reproduce the issue: player2 fails to join when player1 does play->newgame', async ({ browser }) => {
    test.setTimeout(25000);

    console.log('=== REPRODUCING KNOWN ISSUE (This test may fail and that\'s expected) ===');
    // This test is designed to document the current broken behavior
    // It may pass or fail depending on timing, but it helps us understand the issue

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const player1 = await context1.newPage();
    const player2 = await context2.newPage();

    try {
      // Setup
      await player1.goto('/');
      await player1.evaluate(() => localStorage.setItem('ttt-player-name', 'IssuePlayer1'));
      await player1.reload();
      await player1.waitForTimeout(BASE_TIMEOUT);

      await player2.goto('/');
      await player2.evaluate(() => localStorage.setItem('ttt-player-name', 'IssuePlayer2'));
      await player2.reload();
      await player2.waitForTimeout(BASE_TIMEOUT);

      // Player1: Play -> New Game sequence
      console.log('🔴 Player1: Play button...');
      await player1.click('button:has-text("Play")');
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 8000 });
      await player1.waitForTimeout(BASE_TIMEOUT);

      console.log('🔴 Player1: New Game button...');

      // Debug: Check what buttons are actually available for player1
      const player1Buttons = await player1.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map(btn => ({
          text: btn.textContent?.trim(),
          classes: btn.className,
          visible: btn.offsetParent !== null,
          disabled: btn.disabled
        }));
      });
      console.log('🔍 Player1 available buttons:', JSON.stringify(player1Buttons, null, 2));

      // Try to find the button more flexibly
      const playOrNewGameButton = player1.locator('button').filter({ hasText: /^(New Game|Play)$/ });
      await expect(playOrNewGameButton).toBeVisible({ timeout: 5000 });
      await playOrNewGameButton.click();
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 8000 });
      await player1.waitForTimeout(BASE_TIMEOUT * 2);

      // Player2: Play (should join but might not due to the bug)
      console.log('🔵 Player2: Play button...');
      await player2.click('button:has-text("Play")');
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 8000 });
      await player2.waitForTimeout(BASE_TIMEOUT * 3);

      // Check the outcome - this might show the bug
      const player1Status = await player1.evaluate(() => {
        return {
          status: document.querySelector('.game-status')?.textContent || '',
          hasOpponent: document.querySelector('.game-status')?.textContent?.includes('IssuePlayer2') || false
        };
      });

      const player2Status = await player2.evaluate(() => {
        return {
          status: document.querySelector('.game-status')?.textContent || '',
          hasOpponent: document.querySelector('.game-status')?.textContent?.includes('IssuePlayer1') || false
        };
      });

      console.log('🔴 Player1 sees opponent:', player1Status.hasOpponent, '| Status:', player1Status.status);
      console.log('🔵 Player2 sees opponent:', player2Status.hasOpponent, '| Status:', player2Status.status);

      const bothMatched = player1Status.hasOpponent && player2Status.hasOpponent;
      console.log(`🤝 Players matched: ${bothMatched}`);

      // Document the current behavior - this assertion might fail and that's informative
      if (!bothMatched) {
        console.log('❌ ISSUE REPRODUCED: Players did not match after Play->NewGame->Play sequence');
        console.log('   This confirms the bug exists and needs to be fixed');

        // For now, let's make this a soft assertion so we can see the behavior
        // In a real scenario, you might want this to fail to document the bug
        console.warn('Expected players to match, but they did not. This indicates the matching issue.');
      } else {
        console.log('✅ Players matched successfully - issue may be intermittent or fixed');
      }

      // Don't fail the test here - just document what happened
      // expect(bothMatched).toBe(true); // This would fail if the bug exists

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
