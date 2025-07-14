import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/testUtils';

const BASE_TIMEOUT = 500;

test.describe('Play-NewGame-Play Matching Issue', () => {
  test('should allow player2 to join when player1 hits play->newgame before player2 hits play', async ({ browser }) => {
    test.setTimeout(30000);

    // Generate unique player names for this test run
    const { player1: player1Name, player2: player2Name } = TestUtils.generateUniquePlayerNames('play-newgame-test');
    console.log(`🎯 Test using players: ${player1Name} and ${player2Name}`);

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const player1 = await context1.newPage();
    const player2 = await context2.newPage();

    try {
      console.log('=== Simple Isolation Test: Player1 Play -> NewGame -> Player2 Play ===');

      // === STEP 1: Setup both players with unique names ===
      console.log('🚀 Step 1: Setting up players with unique names...');
      await TestUtils.setupPlayer(player1, player1Name);
      await TestUtils.setupPlayer(player2, player2Name);

      console.log('✅ Both players set up with unique identifiers');

      // === STEP 2: Player1 hits "Play" ===
      console.log('🔴 Step 2: Player1 clicking "Play"...');
      await player1.click('button:has-text("Play")');
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });
      await player1.waitForTimeout(BASE_TIMEOUT * 2);

      console.log('✅ Player1 successfully created a game');

      // === STEP 3: Player1 hits "New Game" ===
      console.log('🔴 Step 3: Player1 clicking "New Game"...');
      const newGameButton = player1.locator('button').filter({ hasText: /New Game/ });
      await expect(newGameButton).toBeVisible({ timeout: 3000 });
      await newGameButton.click();
      await player1.waitForTimeout(BASE_TIMEOUT * 3);

      console.log('✅ Player1 successfully started new game');

      // === STEP 4: Player2 hits "Play" ===
      console.log('🔵 Step 4: Player2 clicking "Play" to join Player1...');
      await player2.click('button:has-text("Play")');
      await expect(player2.locator('.game-board')).toBeVisible({ timeout: 5000 });
      await player2.waitForTimeout(BASE_TIMEOUT * 3);

      console.log('✅ Player2 has a game board');

      // === STEP 5: Wait for matching ===
      console.log('🤝 Step 5: Waiting for player matching...');
      await player1.waitForTimeout(BASE_TIMEOUT * 4);
      await player2.waitForTimeout(BASE_TIMEOUT * 2);

      // === STEP 6: Verify both players are matched ===
      const player1GameState = await player1.evaluate((p2Name) => {
        const statusEl = document.querySelector('.game-status');
        const boardButtons = document.querySelectorAll('.game-board button');
        const enabledButtons = Array.from(boardButtons).filter(btn => !btn.disabled);

        return {
          hasGameBoard: !!document.querySelector('.game-board'),
          statusText: statusEl?.textContent || 'No status',
          hasOpponent: statusEl?.textContent?.includes(p2Name) || false,
          canMove: enabledButtons.length > 0
        };
      }, player2Name);

      const player2GameState = await player2.evaluate((p1Name) => {
        const statusEl = document.querySelector('.game-status');
        const boardButtons = document.querySelectorAll('.game-board button');
        const enabledButtons = Array.from(boardButtons).filter(btn => !btn.disabled);

        return {
          hasGameBoard: !!document.querySelector('.game-board'),
          statusText: statusEl?.textContent || 'No status',
          hasOpponent: statusEl?.textContent?.includes(p1Name) || false,
          canMove: enabledButtons.length > 0
        };
      }, player1Name);

      console.log('🔴 P1 Final State:', JSON.stringify(player1GameState, null, 2));
      console.log('🔵 P2 Final State:', JSON.stringify(player2GameState, null, 2));

      // === STEP 7: Test move synchronization ===
      console.log('🎮 Step 7: Testing move synchronization...');

      let moveTestPassed = false;

      if (player1GameState.canMove) {
        console.log('🔴 Player1 attempting first move...');
        await player1.click('.game-board button:first-child');
        await player1.waitForTimeout(2000);

        const player2SeesMove = await player2.locator('.game-board button:first-child .symbol').textContent();
        console.log(`🔵 Player2 sees move: "${player2SeesMove}"`);

        moveTestPassed = player2SeesMove?.match(/[XO]/) !== null;
      } else if (player2GameState.canMove) {
        console.log('🔵 Player2 attempting first move...');
        await player2.click('.game-board button:first-child');
        await player2.waitForTimeout(2000);

        const player1SeesMove = await player1.locator('.game-board button:first-child .symbol').textContent();
        console.log(`🔴 Player1 sees move: "${player1SeesMove}"`);

        moveTestPassed = player1SeesMove?.match(/[XO]/) !== null;
      } else {
        console.log('❌ CRITICAL: Neither player can move - not properly matched!');
      }

      // === ASSERTIONS ===
      console.log('📋 Final Test Results:');
      console.log(`   - Both have game boards: ${player1GameState.hasGameBoard && player2GameState.hasGameBoard}`);
      console.log(`   - Player1 sees Player2: ${player1GameState.hasOpponent}`);
      console.log(`   - Player2 sees Player1: ${player2GameState.hasOpponent}`);
      console.log(`   - Move test passed: ${moveTestPassed}`);

      expect(player1GameState.hasGameBoard).toBe(true);
      expect(player2GameState.hasGameBoard).toBe(true);

      const areMatched = player1GameState.hasOpponent || player2GameState.hasOpponent;
      expect(areMatched).toBe(true);
      expect(moveTestPassed).toBe(true);

      console.log('🎉 TEST PASSED: Players successfully matched with unique identifiers!');

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should isolate tests with different unique names', async ({ browser }) => {
    // This test uses completely different player names, so no conflict
    const { player1: player1Name, player2: player2Name } = TestUtils.generateUniquePlayerNames('isolation-test');
    console.log(`🎯 Isolation test using players: ${player1Name} and ${player2Name}`);

    const context1 = await browser.newContext();
    const player1 = await context1.newPage();

    try {
      await TestUtils.setupPlayer(player1, player1Name);
      await player1.click('button:has-text("Play")');
      await expect(player1.locator('.game-board')).toBeVisible({ timeout: 5000 });

      console.log('✅ Isolation test passed - no conflicts with other tests');
    } finally {
      await context1.close();
    }
  });
});
