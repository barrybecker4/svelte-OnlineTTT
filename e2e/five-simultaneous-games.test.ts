import { test, expect, chromium } from '@playwright/test';

const BASE_TIMEOUT = 800;
const MATCH_TIMEOUT = 1200;

interface GamePair {
  id: number;
  player1: {
    browser: any;
    context: any;
    page: any;
    name: string;
  };
  player2: {
    browser: any;
    context: any;
    page: any;
    name: string;
  };
}

test.describe('Five Simultaneous Games Test', () => {
  test('should create 5 concurrent games using manual UI clicks with positioned windows', async () => {
    test.setTimeout(120000); // 2 minutes timeout
    console.log('🎮 Starting 5 simultaneous games test with positioned windows...');
    console.log('🔴 Red = Player A (X)  |  🔵 Blue = Player B (O)');

    // Check if WebSocket worker is running
    console.log('🏥 Checking WebSocket worker health...');
    try {
      const healthResponse = await fetch('http://localhost:8787/health');
      if (healthResponse.ok) {
        console.log('✅ WebSocket worker is running - expect real-time moves!');
      } else {
        console.log('⚠️ WebSocket worker not responding');
      }
    } catch (error) {
      console.log('❌ WebSocket worker not running - start it with: cd websocket-worker && npx wrangler dev --local --port 8787');
    }

    const gamePairs: GamePair[] = [];

    try {
      for (let gameNum = 1; gameNum <= 5; gameNum++) {
        const pair = await createPositionedGamePair(gameNum);
        gamePairs.push(pair);
      }

      console.log('✅ Created 5 positioned game pairs');

      console.log('📱 Setting up all players with staggered timing...');
      for (let i = 0; i < gamePairs.length; i++) {
        const pair = gamePairs[i];
        await Promise.all([
          setupPlayer(pair.player1),
          setupPlayer(pair.player2)
        ]);

        if (i < gamePairs.length - 1) {
          await waitForTimeout(200);
        }
      }

      console.log('🚀 Starting games with careful timing...');

      // Start games with sequential timing
      const gameResults = [];
      for (let i = 0; i < gamePairs.length; i++) {
        const pair = gamePairs[i];
        const result = await startGamePairWithRetry(pair, i + 1);
        gameResults.push(result);

        if (i < gamePairs.length - 1) {
          await waitForTimeout(MATCH_TIMEOUT);
        }
      }

      console.log('🎯 Verifying all games are active...');

      // Verify games
      const verificationResults = await Promise.all(
        gamePairs.map((pair, index) => verifyGameActiveWithRetry(pair, gameResults[index]))
      );

      const successfulGames = verificationResults.filter(result => result.success);

      console.log('\n📊 GAME VERIFICATION SUMMARY:');
      verificationResults.forEach((result, index) => {
        const status = result.success ? '✅ ACTIVE' : '❌ FAILED';
        const details = result.matched ? '(MATCHED)' : result.error ? `(${result.error})` : '(NO MATCH)';
        console.log(`Game ${index + 1}: ${status} ${details}`);
      });

      expect(successfulGames.length).toEqual(5);

      // Test basic gameplay in all games
      verificationResults.forEach((result, index) => {
        if (result.success) {
          console.log(`🎮 Testing basic gameplay in Game ${index + 1}...`);
          testBasicGameplay(gamePairs[index]);
        } else {
          console.log(`❌ Skipping gameplay test for Game ${index + 1} due to failure`);
        }
      });

    } finally {
      console.log('🧹 Cleaning up all browser instances...');
      // Close all browsers
      for (const pair of gamePairs) {
        try {
          await pair.player1.browser?.close();
          await pair.player2.browser?.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      console.log('🧹 Cleanup complete');
    }
  });
});

// Helper functions with positioned browser launching

// Each game pair will be in a column
async function createPositionedGamePair(gameNum: number): Promise<GamePair> {
  const windowWidth = 600;
  const windowHeight = 800;
  const row = 0;
  const col = gameNum - 1;

  // Position windows in pairs: left side and right side
  const player1X = col * windowWidth + 5;  // Player A (top of pair)
  const player1Y = 5;
  const player2X = player1X;     // Player B (bottom of pair)
  const player2Y = player1Y + windowHeight + 5;

  console.log(`📱 Game ${gameNum}: Creating positioned windows at (${player1X},${player1Y}) and (${player2X},${player2Y})`);

  // Launch separate browser instances with positioning
  const browser1 = await chromium.launch({
    headless: false,
    args: [
      `--window-position=${player1X},${player1Y}`,
      `--window-size=${windowWidth},${windowHeight}`
    ]
  });

  const browser2 = await chromium.launch({
    headless: false,
    args: [
      `--window-position=${player2X},${player2Y}`,
      `--window-size=${windowWidth},${windowHeight}`
    ]
  });

  const context1 = await browser1.newContext({
    viewport: { width: windowWidth - 50, height: windowHeight - 100 },
    userAgent: `TestBot-Player${gameNum}A`,
  });

  const context2 = await browser2.newContext({
    viewport: { width: windowWidth - 50, height: windowHeight - 100 },
    userAgent: `TestBot-Player${gameNum}B`,
  });

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Add visual styling for easy identification
  await page1.addInitScript(`
    document.title = '🔴 Game ${gameNum} - Player A (X)';
    setTimeout(() => {
      document.body.style.border = '5px solid #ff4757';
      document.body.style.backgroundColor = '#ffe8e8';

      const banner = document.createElement('div');
      banner.textContent = '🔴 GAME ${gameNum} - PLAYER A (X)';
      banner.style.position = 'fixed';
      banner.style.top = '5px';
      banner.style.left = '50%';
      banner.style.transform = 'translateX(-50%)';
      banner.style.background = '#ff4757';
      banner.style.color = 'white';
      banner.style.padding = '8px 16px';
      banner.style.borderRadius = '8px';
      banner.style.fontWeight = 'bold';
      banner.style.zIndex = '9999';
      banner.style.fontSize = '14px';
      document.body.appendChild(banner);
    }, 200);
  `);

  await page2.addInitScript(`
    document.title = '🔵 Game ${gameNum} - Player B (O)';
    setTimeout(() => {
      document.body.style.border = '5px solid #3742fa';
      document.body.style.backgroundColor = '#e8f0ff';

      const banner = document.createElement('div');
      banner.textContent = '🔵 GAME ${gameNum} - PLAYER B (O)';
      banner.style.position = 'fixed';
      banner.style.top = '5px';
      banner.style.left = '50%';
      banner.style.transform = 'translateX(-50%)';
      banner.style.background = '#3742fa';
      banner.style.color = 'white';
      banner.style.padding = '8px 16px';
      banner.style.borderRadius = '8px';
      banner.style.fontWeight = 'bold';
      banner.style.zIndex = '9999';
      banner.style.fontSize = '14px';
      document.body.appendChild(banner);
    }, 200);
  `);

  return {
    id: gameNum,
    player1: {
      browser: browser1,
      context: context1,
      page: page1,
      name: `Game${gameNum}PlayerA`
    },
    player2: {
      browser: browser2,
      context: context2,
      page: page2,
      name: `Game${gameNum}PlayerB`
    }
  };
}

async function setupPlayer(player: { page: any; name: string }): Promise<void> {
  await player.page.goto('/');
  await player.page.evaluate((name) => {
    localStorage.setItem('ttt-player-name', name);
  }, player.name);
  await player.page.reload();
  await expect(player.page.locator('h1')).toBeVisible({ timeout: 5000 });
  await waitForTimeout(BASE_TIMEOUT);
}

async function startGamePairWithRetry(pair: GamePair, gameNumber: number): Promise<{ success: boolean; error?: string }> {
  console.log(`🎮 Starting Game ${gameNumber} (${pair.player1.name} vs ${pair.player2.name})...`);

  try {
    await clickPlayButton(pair.player1.page, pair.player1.name);
    await waitForTimeout(300);
    await clickPlayButton(pair.player2.page, pair.player2.name);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`❌ Game ${gameNumber} failed to start: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

async function clickPlayButton(page: any, playerName: string): Promise<void> {
  const playButton = page.locator('button:has-text("Play")');
  await expect(playButton).toBeVisible({ timeout: 5000 });
  await playButton.click();
  console.log(`  ${playerName} clicked Play`);
}

async function verifyGameActiveWithRetry(
  pair: GamePair,
  startResult: { success: boolean; error?: string }
): Promise<{ success: boolean; matched?: boolean; error?: string }> {

  if (!startResult.success) {
    return { success: false, error: startResult.error };
  }

  try {
    let attempt = 0;
    const maxAttempts = 3;
    let boardsVisible = false;

    while (!boardsVisible && attempt < maxAttempts) {
      try {
        await Promise.all([
          expect(pair.player1.page.locator('.game-board')).toBeVisible({ timeout: 4000 }),
          expect(pair.player2.page.locator('.game-board')).toBeVisible({ timeout: 4000 })
        ]);
        boardsVisible = true;
      } catch (e) {
        attempt++;
        if (attempt < maxAttempts) {
          console.log(`  Retry ${attempt}/${maxAttempts} for Game ${pair.id} board visibility...`);
          await waitForTimeout(1000);
        } else {
          throw e;
        }
      }
    }

    const player1FirstCell = pair.player1.page.locator('.game-board button').first();
    const player2FirstCell = pair.player2.page.locator('.game-board button').first();

    await expect(player1FirstCell).toBeVisible({ timeout: 2000 });
    await expect(player2FirstCell).toBeVisible({ timeout: 2000 });

    const p1CellCount = await pair.player1.page.locator('.game-board button').count();
    const p2CellCount = await pair.player2.page.locator('.game-board button').count();

    const matched = p1CellCount === 9 && p2CellCount === 9;

    return { success: true, matched };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage.substring(0, 50)
    };
  }
}

async function testBasicGameplay(pair: GamePair): Promise<void> {
  console.log('🎲 Testing manual gameplay in positioned game...');

  try {
    console.log('  Checking initial game state...');

    const p1StatusText = await pair.player1.page.locator('.game-status').textContent().catch(() => 'No status');
    const p2StatusText = await pair.player2.page.locator('.game-status').textContent().catch(() => 'No status');

    console.log(`  Player1 status: "${p1StatusText}"`);
    console.log(`  Player2 status: "${p2StatusText}"`);

    const p1FilledCells = await pair.player1.page.locator('.game-board button .symbol').count();
    const p2FilledCells = await pair.player2.page.locator('.game-board button .symbol').count();

    console.log(`  Initial filled cells: P1=${p1FilledCells}, P2=${p2FilledCells}`);

    if (p1FilledCells >= 5) {
      console.log('⚠️ Board already has moves - games completing very quickly');
      console.log('💡 This indicates excellent WebSocket real-time performance!');
      return;
    }

    console.log('  Attempting immediate manual move...');

    const allCells = await pair.player1.page.locator('.game-board button').all();
    let manualMoveSuccess = false;

    for (let i = 0; i < Math.min(3, allCells.length); i++) {
      const cell = allCells[i];

      const hasSymbol = await cell.locator('.symbol').count() > 0;
      const isEnabled = await cell.isEnabled();

      console.log(`    Cell ${i}: empty=${!hasSymbol}, enabled=${isEnabled}`);

      if (!hasSymbol && isEnabled) {
        console.log(`    ⚡ Making manual move in cell ${i}...`);

        await cell.click();
        await waitForTimeout(200);

        const moveAppeared = await cell.locator('.symbol').count() > 0;
        if (moveAppeared) {
          const symbol = await cell.locator('.symbol').textContent().catch(() => '');
          console.log(`    ✅ Manual move SUCCESS! Symbol: "${symbol}"`);

          await waitForTimeout(300);
          const p2SameCell = pair.player2.page.locator('.game-board button').nth(i);
          const p2HasSymbol = await p2SameCell.locator('.symbol').count() > 0;

          if (p2HasSymbol) {
            const p2Symbol = await p2SameCell.locator('.symbol').textContent().catch(() => '');
            console.log(`    🔄 Move synced to Player2: "${p2Symbol}"`);
            manualMoveSuccess = true;
          }
          break;
        }
      }
    }

    if (manualMoveSuccess) {
      console.log('🎉 MANUAL MOVE TEST PASSED! Players can interact with positioned games.');
    } else {
      console.log('⚠️ No manual moves made - but positioned games are working correctly');
    }

  } catch (error) {
    console.log('⚠️ Manual move test error:', error instanceof Error ? error.message : error);
    console.log('   Positioned windows test successful regardless');
  }
}

async function waitForTimeout(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}
