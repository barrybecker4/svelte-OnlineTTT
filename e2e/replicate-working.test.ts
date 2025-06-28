// e2e/replicate-working.test.ts
import { expect, test } from '@playwright/test';

test.describe('Replicate Working Flow', () => {
  test('Single player - replicate what worked in debug', async ({ browser }) => {
    const context1 = await browser.newContext();
    const player1Page = await context1.newPage();
    
    try {
      // Add the same console monitoring as the working debug test
      player1Page.on('console', msg => {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
      });
      
      player1Page.on('pageerror', error => {
        console.log('[PAGE ERROR]:', error.message);
      });
      
      player1Page.on('request', request => {
        if (request.url().includes('/api/')) {
          console.log('[API REQUEST]:', request.method(), request.url());
        }
      });
      
      player1Page.on('response', response => {
        if (response.url().includes('/api/')) {
          console.log('[API RESPONSE]:', response.status(), response.url());
        }
      });
      
      console.log('=== Exact replication of working debug test ===');
      
      console.log('1. Navigating to page...');
      await player1Page.goto('/');
      await expect(player1Page.locator('h1')).toBeVisible();
      
      console.log('2. Setting localStorage...');
      await player1Page.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'WorkingTestPlayer');
        console.log('[TEST] localStorage set to:', localStorage.getItem('ttt-player-name'));
      });
      
      console.log('3. Reloading page...');
      await player1Page.reload();
      await expect(player1Page.locator('h1')).toBeVisible();
      
      // Wait for onMount to complete
      await player1Page.waitForTimeout(2000);
      
      console.log('4. Checking localStorage after reload...');
      const nameAfterReload = await player1Page.evaluate(() => {
        return localStorage.getItem('ttt-player-name');
      });
      console.log('Name after reload:', nameAfterReload);
      
      console.log('5. Clicking Play button...');
      const playButton = player1Page.locator('button:has-text("Play")');
      await expect(playButton).toBeVisible();
      await playButton.click();
      
      console.log('6. Waiting for game creation...');
      await player1Page.waitForTimeout(8000); // Same wait time as debug test
      
      console.log('7. Checking if game board exists...');
      const gameBoardExists = await player1Page.locator('.game-board').count();
      console.log('Game board count:', gameBoardExists);
      
      if (gameBoardExists > 0) {
        console.log('✅ SUCCESS: Game board appeared!');
        await expect(player1Page.locator('.game-board')).toBeVisible();
        
        // Check for the waiting message
        const waitingText = await player1Page.locator('text=Waiting for opponent...').count();
        console.log('Waiting text found:', waitingText > 0);
        
        if (waitingText > 0) {
          console.log('✅ Perfect! Found waiting message too!');
        }
      } else {
        console.log('❌ Game board did not appear');
        
        // Debug what we do have
        const allText = await player1Page.locator('body').textContent();
        console.log('Page content:', allText?.slice(0, 500));
        
        const allButtons = await player1Page.locator('button').allTextContents();
        console.log('Buttons:', allButtons);
      }
      
    } finally {
      await context1.close();
    }
  });
  
  test('Two players sequentially - if single works', async ({ browser }) => {
    // Only run this if we want to test two players after confirming single works
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const player1Page = await context1.newPage();
    const player2Page = await context2.newPage();
    
    try {
      console.log('=== TWO PLAYER TEST ===');
      
      // Player 1 setup (same as working single player)
      console.log('Setting up Player 1...');
      await player1Page.goto('/');
      await expect(player1Page.locator('h1')).toBeVisible();
      
      await player1Page.evaluate(() => {
        localStorage.setItem('ttt-player-name', 'Player1');
      });
      await player1Page.reload();
      await expect(player1Page.locator('h1')).toBeVisible();
      await player1Page.waitForTimeout(2000);
      
      console.log('Player 1 clicking Play...');
      await player1Page.click('button:has-text("Play")');
      await player1Page.waitForTimeout(8000);
      
      const p1GameBoard = await player1Page.locator('.game-board').count();
      console.log('Player 1 game board exists:', p1GameBoard > 0);
      
      if (p1GameBoard > 0) {
        console.log('✅ Player 1 game created successfully');
        
        // Now add Player 2
        console.log('Setting up Player 2...');
        await player2Page.goto('/');
        await expect(player2Page.locator('h1')).toBeVisible();
        
        await player2Page.evaluate(() => {
          localStorage.setItem('ttt-player-name', 'Player2');
        });
        await player2Page.reload();
        await expect(player2Page.locator('h1')).toBeVisible();
        await player2Page.waitForTimeout(2000);
        
        console.log('Player 2 clicking Play...');
        await player2Page.click('button:has-text("Play")');
        await player2Page.waitForTimeout(8000);
        
        const p2GameBoard = await player2Page.locator('.game-board').count();
        console.log('Player 2 game board exists:', p2GameBoard > 0);
        
        if (p2GameBoard > 0) {
          console.log('✅ Both players have game boards!');
          console.log('✅ SUCCESS: Two player setup working!');
        }
      }
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
