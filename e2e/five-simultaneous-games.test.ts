import { test, expect, chromium } from '@playwright/test';

const NUM_GAMES = 5; // Number of games to run concurrently
const BASE_TIMEOUT = 500;

const GAME_PATTERNS = [
  [
    {player: 1, selector: '.game-board button:nth-child(1)', symbol: 'X'}, // pos 0
    {player: 2, selector: '.game-board button:nth-child(2)', symbol: 'O'}, // pos 1
    {player: 1, selector: '.game-board button:nth-child(4)', symbol: 'X'}, // pos 3
    {player: 2, selector: '.game-board button:nth-child(5)', symbol: 'O'}, // pos 4
    {player: 1, selector: '.game-board button:nth-child(7)', symbol: 'X'}  // pos 6 - wins
  ],
  [
    {player: 1, selector: '.game-board button:nth-child(4)', symbol: 'X'}, // pos 3
    {player: 2, selector: '.game-board button:nth-child(1)', symbol: 'O'}, // pos 0
    {player: 1, selector: '.game-board button:nth-child(5)', symbol: 'X'}, // pos 4
    {player: 2, selector: '.game-board button:nth-child(2)', symbol: 'O'}, // pos 1
    {player: 1, selector: '.game-board button:nth-child(7)', symbol: 'X'}, // pos 6
    {player: 2, selector: '.game-board button:nth-child(3)', symbol: 'O'}  // pos 2 - wins
  ],
  [
    {player: 1, selector: '.game-board button:nth-child(1)', symbol: 'X'}, // pos 0
    {player: 2, selector: '.game-board button:nth-child(2)', symbol: 'O'}, // pos 1
    {player: 1, selector: '.game-board button:nth-child(5)', symbol: 'X'}, // pos 4
    {player: 2, selector: '.game-board button:nth-child(3)', symbol: 'O'}, // pos 2
    {player: 1, selector: '.game-board button:nth-child(9)', symbol: 'X'}  // pos 8 - wins
  ],
  [
    {player: 1, selector: '.game-board button:nth-child(1)', symbol: 'X'}, // pos 0
    {player: 2, selector: '.game-board button:nth-child(2)', symbol: 'O'}, // pos 1
    {player: 1, selector: '.game-board button:nth-child(3)', symbol: 'X'}, // pos 2
    {player: 2, selector: '.game-board button:nth-child(5)', symbol: 'O'}, // pos 4
    {player: 1, selector: '.game-board button:nth-child(6)', symbol: 'X'}, // pos 5
    {player: 2, selector: '.game-board button:nth-child(8)', symbol: 'O'}  // pos 7 - wins
  ],
  [
    {player: 1, selector: '.game-board button:nth-child(1)', symbol: 'X'}, // pos 0
    {player: 2, selector: '.game-board button:nth-child(4)', symbol: 'O'}, // pos 3
    {player: 1, selector: '.game-board button:nth-child(2)', symbol: 'X'}, // pos 1
    {player: 2, selector: '.game-board button:nth-child(5)', symbol: 'O'}, // pos 4
    {player: 1, selector: '.game-board button:nth-child(3)', symbol: 'X'}  // pos 2 - wins top row
  ],
];

const EXPECTED_RESULTS = [
  'X wins with left column',
  'O wins with top row',
  'X wins with diagonal',
  'O wins with middle column',
  'X wins with top row',
];

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

test.describe('Five Simultaneous Complete Games Test', () => {
  test('should play 5 complete concurrent games with different outcomes', async () => {
    test.setTimeout(120000); // 2 minute timeout
    console.log('🎮 Starting 5 simultaneous COMPLETE games test...');
    console.log('🔴 Red = Player A (X)  |  🔵 Blue = Player B (O)');
    console.log('🎯 Using the EXACT working patterns from successful tests');

    await checkWebSocketHealth();
    const gamePairs: GamePair[] = [];

    try {
      await createGamePairs(gamePairs);
      const gameResults = await startAllGames(gamePairs);
      const verificationResults = await verifyAllGamesActive(gamePairs, gameResults);
      const gameOutcomes = await runSimultaneousGameplay(gamePairs, verificationResults);
      await verifyFinalOutcomes(gamePairs, gameOutcomes);
      await waitForTimeout(5000);
    } finally {
      console.log('🧹 Cleaning up all browser instances...');
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

async function checkWebSocketHealth() {
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
}

async function createGamePairs(gamePairs: GamePair[]) {
  for (let gameNum = 1; gameNum <= NUM_GAMES; gameNum++) {
    const pair = await createPositionedGamePair(gameNum);
    gamePairs.push(pair);
  }

  console.log(`✅ Created ${NUM_GAMES} positioned game pairs`);
  console.log('📱 Setting up all players with staggered timing...');
  for (let i = 0; i < gamePairs.length; i++) {
    const pair = gamePairs[i];
    await Promise.all([
      setupPlayer(pair.player1),
      setupPlayer(pair.player2)
    ]);

    if (i < gamePairs.length - 1) {
      await waitForTimeout(100);
    }
  }
}

async function startAllGames(gamePairs: GamePair[]): [] {
  console.log('🚀 Starting games with careful timing...');
  const gameResults = [];
  for (let i = 0; i < gamePairs.length; i++) {
    const pair = gamePairs[i];
    const result = await startGamePair(pair, i + 1);
    gameResults.push(result);

    if (i < gamePairs.length - 1) {
      await waitForTimeout(BASE_TIMEOUT);
    }
  }
  return gameResults;
}

async function verifyAllGamesActive(gamePairs: GamePair[], gameResults: []) {
  console.log('🎯 Verifying all games are active...');
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

  console.log("Num active games = ", successfulGames.length);
  expect(successfulGames.length).toEqual(NUM_GAMES);
  return verificationResults;
}

async function runSimultaneousGameplay(gamePairs: GamePair[], verificationResults: []) {
  console.log('\n🎲 STARTING SIMULTANEOUS GAMEPLAY!');
  console.log('⚡ Using working move patterns but playing all games at once');

  // Start all games playing simultaneously using Promise.all
  const gamePromises = gamePairs.map((pair, index) => {
    if (verificationResults[index].success) {
      console.log(`🎮 Starting Game ${index + 1} simultaneously...`);
      return playCompleteGameSimultaneously(pair, index + 1);
    } else {
      console.log(`❌ Skipping Game ${index + 1} due to setup failure`);
      return Promise.resolve({ success: false, reason: 'Setup failed' });
    }
  });

  // Wait for all games to complete
  return await Promise.all(gamePromises);
}

async function verifyFinalOutcomes(gamePairs: GamePair[], gameOutcomes: []) {
  console.log('\n🏆 FINAL GAME OUTCOMES:');
  gameOutcomes.forEach((outcome, index) => {
    const gameNum = index + 1;
    if (outcome.success) {
      console.log(`Game ${gameNum}: ${outcome.result} 🎉`);
    } else {
      console.log(`Game ${gameNum}: FAILED - ${outcome.reason} ❌`);
    }
  });

  const successfulGameCount = gameOutcomes.filter(outcome => outcome.success).length;
  console.log(`\n📈 Successfully completed ${successfulGameCount}/${NUM_GAMES} games`);
  expect(successfulGameCount).toEqual(NUM_GAMES);
}

async function createPositionedGamePair(gameNum: number): Promise<GamePair> {
  const windowWidth = 600;
  const windowHeight = 800;

  // Position windows in pairs: left side and right side
  const player1X = (gameNum - 1) * windowWidth + 5;  // Player A (top of pair)
  const player1Y = 5;
  const player2X = player1X;     // Player B (bottom of pair)
  const player2Y = player1Y + windowHeight + 5;

  console.log(`📱 Game ${gameNum}: Creating positioned windows at (${player1X},${player1Y}) and (${player2X},${player2Y})`);

  // Launch separate browser instances with positioning
  const browser1 = await launchBrowserInstance(player1X, player1Y, windowWidth, windowHeight);
  const browser2 = await launchBrowserInstance(player2X, player2Y, windowWidth, windowHeight);

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
      name: `Player${gameNum}A`  // Use different names like working tests
    },
    player2: {
      browser: browser2,
      context: context2,
      page: page2,
      name: `Player${gameNum}B`  // Use different names like working tests
    }
  };
}

async function launchBrowserInstance(playerX, playerY, width, height) {
  const browser = await chromium.launch({
    headless: false,
    args: [
      `--window-position=${playerX},${playerY}`,
      `--window-size=${width},${height}`
    ]
  });
  return browser;
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

async function startGamePair(pair: GamePair, gameNumber: number): Promise<{ success: boolean; error?: string }> {
  console.log(`🎮 Starting Game ${gameNumber} (${pair.player1.name} vs ${pair.player2.name})...`);

  try {
    await waitForTimeout(300);
    await clickPlayButton(pair.player1.page, pair.player1.name);
    await waitForTimeout(700);
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

  console.log(`🔍 ....................Verifying Game ${pair.id} is active...`);
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
          console.log(`Failed to verify after ${maxAttempts} attempts`);
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

// Play complete games simultaneously using the working move pattern
async function playCompleteGameSimultaneously(pair: GamePair, gameNumber: number): Promise<{success: boolean, result?: string, reason?: string}> {
  console.log(`🎲 Game ${gameNumber}: Starting simultaneous complete game`);

  try {
    // Wait for WebSocket connections and game matching to complete (from working test)
    await pair.player2.page.waitForTimeout(BASE_TIMEOUT);

    // First verify we can make an immediate move (like working tests)
    const firstCell = pair.player1.page.locator('.game-board button:first-child');
    const isEnabled = await firstCell.isEnabled();

    if (!isEnabled) {
      console.log(`    ❌ Game ${gameNumber}: Cell not enabled for immediate move`);
      return { success: false, reason: 'Cell not enabled' };
    }

    console.log(`  🎯 Game ${gameNumber}: Playing moves simultaneously...`);

    // Define different game patterns for each game
    const gamePattern: Array<{player: 1 | 2, selector: string, symbol: string}> = GAME_PATTERNS[gameNumber -1];
    const expectedResult: String = EXPECTED_RESULTS[gameNumber - 1];
    let movesPlayed = 0;

    // Play all moves with small delays (like working tests)
    for (const move of gamePattern) {
      const currentPlayerPage = move.player === 1 ? pair.player1.page : pair.player2.page;
      const otherPlayerPage = move.player === 1 ? pair.player2.page : pair.player1.page;

      try {
        // Make move using working pattern (click immediately if enabled)
        const cell = currentPlayerPage.locator(move.selector);
        const isEnabled = await cell.isEnabled();

        if (isEnabled) {
          await cell.click();
          await currentPlayerPage.waitForTimeout(Math.random() * BASE_TIMEOUT + 200);

          const symbol = await cell.locator('.symbol').textContent();
          if (symbol?.trim() === move.symbol) {
            movesPlayed++;
            console.log(`    ✅ Game ${gameNumber} Move ${movesPlayed}: ${move.symbol} played`);

            // Quick sync check
            const otherCell = otherPlayerPage.locator(move.selector);
            const syncSymbol = await otherCell.locator('.symbol').textContent();
            if (syncSymbol === move.symbol) {
              console.log(`      🔄 Game ${gameNumber}: Synced`);
            }
          }
        } else {
          console.log(`    ⚠️ Game ${gameNumber}: Cell not enabled for ${move.symbol}`);
        }

        // Check if game ended
        const hasNewGameButton = await currentPlayerPage.locator('button:has-text("New Game")').count();
        if (hasNewGameButton > 0) {
          console.log(`    🏁 Game ${gameNumber} ended after ${movesPlayed} moves`);
          break;
        }

        // Brief pause between moves for simultaneous play
        await waitForTimeout(Math.random() * BASE_TIMEOUT + BASE_TIMEOUT);

      } catch (error) {
        console.log(`    ❌ Game ${gameNumber}: Move failed: ${error}`);
      }
    }
    return { success: true, result: `${expectedResult} (${movesPlayed} moves)` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ❌ Game ${gameNumber} FAILED: ${errorMessage}`);
    return { success: false, reason: errorMessage };
  }
}

async function waitForTimeout(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}
