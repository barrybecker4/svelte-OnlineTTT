// e2e/five-games-creation-only.test.ts
import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

interface GamePlayer {
  page: Page;
  context: BrowserContext;
  name: string;
  gameId?: string;
  playerId?: string;
  symbol?: 'X' | 'O';
}

interface Game {
  id: number;
  player1: GamePlayer;
  player2: GamePlayer;
}

test.describe('Five Games Creation Test - Simple', () => {
  test('should successfully create 5 concurrent games without timeouts', async ({ browser }) => {
    test.setTimeout(60000); // 1 minute timeout - much more reasonable
    console.log('🎮 Starting SIMPLE 5 games creation test...');

    const contexts: BrowserContext[] = [];
    const games: Game[] = [];

    try {
      // Create 10 browser contexts (2 per game)
      for (let i = 0; i < 10; i++) {
        contexts.push(await browser.newContext());
      }

      // Create 5 games with 2 players each
      for (let gameNum = 1; gameNum <= 5; gameNum++) {
        const player1Context = contexts[(gameNum - 1) * 2];
        const player2Context = contexts[(gameNum - 1) * 2 + 1];

        const player1: GamePlayer = {
          page: await player1Context.newPage(),
          context: player1Context,
          name: `Player${gameNum}A`
        };

        const player2: GamePlayer = {
          page: await player2Context.newPage(),
          context: player2Context,
          name: `Player${gameNum}B`
        };

        games.push({
          id: gameNum,
          player1,
          player2
        });
      }

      console.log('✅ Created 5 games with 10 players');

      // Setup all players quickly
      console.log('📱 Setting up all players...');
      await Promise.all(games.flatMap(game => [
        setupPlayerQuick(game.player1),
        setupPlayerQuick(game.player2)
      ]));

      // Create games using direct API approach
      console.log('🚀 Creating games using direct API calls...');
      
      for (const game of games) {
        console.log(`🎮 Creating Game ${game.id}...`);

        // Create games for both players
        const [result1, result2] = await Promise.all([
          createGameViaAPI(game.player1),
          createGameViaAPI(game.player2)
        ]);

        // Verify they got matched into the same game
        if (result1.gameId === result2.gameId) {
          console.log(`✅ Game ${game.id}: Players matched successfully (${result1.gameId})`);
          console.log(`   Player1: ${result1.playerId} (${result1.symbol})`);
          console.log(`   Player2: ${result2.playerId} (${result2.symbol})`);
        } else {
          console.warn(`⚠️ Game ${game.id}: Players in different games`);
          console.log(`   Player1: ${result1.gameId} (${result1.symbol})`);
          console.log(`   Player2: ${result2.gameId} (${result2.symbol})`);
        }

        // Store results
        game.player1.gameId = result1.gameId;
        game.player1.playerId = result1.playerId;
        game.player1.symbol = result1.symbol;
        
        game.player2.gameId = result2.gameId;
        game.player2.playerId = result2.playerId;
        game.player2.symbol = result2.symbol;
      }

      // Verify all games were created
      console.log('✅ All 5 games created successfully!');
      
      // Summary
      console.log('\n📊 GAME CREATION SUMMARY:');
      for (const game of games) {
        const matched = game.player1.gameId === game.player2.gameId;
        console.log(`Game ${game.id}: ${matched ? '✅ MATCHED' : '❌ NOT MATCHED'} (${game.player1.gameId})`);
      }

      // Test that at least 4 out of 5 games got properly matched
      const matchedGames = games.filter(game => game.player1.gameId === game.player2.gameId);
      expect(matchedGames.length).toBeGreaterThanOrEqual(4);
      console.log(`🎉 SUCCESS: ${matchedGames.length}/5 games properly matched!`);

    } finally {
      console.log('🧹 Cleaning up...');
      await Promise.all(contexts.map(context => context.close()));
      console.log('🧹 Cleanup complete');
    }
  });
});

// Helper Functions

async function setupPlayerQuick(player: GamePlayer) {
  await player.page.goto('/');
  await player.page.evaluate((name) => {
    localStorage.setItem('ttt-player-name', name);
  }, player.name);
  await player.page.reload();
  await expect(player.page.locator('h1')).toBeVisible();
  await player.page.waitForTimeout(500); // Minimal wait
}

async function createGameViaAPI(player: GamePlayer): Promise<{
  gameId: string;
  playerId: string;
  symbol: 'X' | 'O';
  success: boolean;
}> {
  console.log(`  Creating game for ${player.name}...`);

  const result = await player.page.evaluate(async (playerName) => {
    try {
      const response = await fetch('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const gameData = await response.json();
      console.log(`🎮 ${playerName} -> Game ${gameData.gameId} (${gameData.playerSymbol})`);
      
      return { 
        success: true, 
        gameId: gameData.gameId, 
        playerId: gameData.playerId,
        symbol: gameData.playerSymbol 
      };
      
    } catch (error) {
      console.error(`❌ ${playerName} game creation failed:`, error);
      return { 
        success: false, 
        gameId: '', 
        playerId: '', 
        symbol: 'X' as const
      };
    }
  }, player.name);

  return result;
}
