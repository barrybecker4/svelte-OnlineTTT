// e2e/debug.test.ts
import { expect, test } from '@playwright/test';

test.describe('Debug Test', () => {
  test('Debug what happens after clicking Play', async ({ browser }) => {
    const context1 = await browser.newContext();
    const player1Page = await context1.newPage();
    
    try {
      // Log all console messages
      player1Page.on('console', msg => {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
      });
      
      // Log any errors
      player1Page.on('pageerror', error => {
        console.log('[PAGE ERROR]:', error.message);
      });
      
      // Log network requests to see API calls
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
      
      console.log('1. Navigating to page...');
      await player1Page.goto('/');
      
      console.log('2. Waiting for h1 to be visible...');
      await expect(player1Page.locator('h1')).toBeVisible();
      
      console.log('3. Looking for Play button...');
      const playButton = player1Page.locator('button:has-text("Play")');
      await expect(playButton).toBeVisible();
      
      console.log('4. Taking screenshot before clicking Play...');
      await player1Page.screenshot({ path: 'debug-before-play.png', fullPage: true });
      
      // Set up dialog handler JUST before clicking Play
      let dialogHandled = false;
      player1Page.on('dialog', async dialog => {
        console.log('[DIALOG]:', dialog.message());
        console.log('[DIALOG TYPE]:', dialog.type());
        await dialog.accept('DebugPlayer');
        dialogHandled = true;
        console.log('[DIALOG] Handled with name: DebugPlayer');
      });
      
      console.log('5. Clicking Play button...');
      await playButton.click();
      
      console.log('6. Waiting for dialog to be handled...');
      await player1Page.waitForFunction(() => true, {}, { timeout: 5000 });
      await player1Page.waitForTimeout(2000); // Wait for dialog
      
      console.log('7. Dialog handled:', dialogHandled);
      
      console.log('8. Waiting for any game creation process...');
      await player1Page.waitForTimeout(8000); // Longer wait for game creation
      
      console.log('9. Taking screenshot after waiting...');
      await player1Page.screenshot({ path: 'debug-after-wait.png', fullPage: true });
      
      console.log('10. Checking what elements are on the page now...');
      const bodyContent = await player1Page.locator('body').innerHTML();
      console.log('Page content length:', bodyContent.length);
      
      // Check if game board exists
      const gameBoard = player1Page.locator('.game-board');
      const gameBoardExists = await gameBoard.count();
      console.log('Game board count:', gameBoardExists);
      
      // Check for any error messages or alerts
      const errorMessages = await player1Page.locator('text=/error|failed|timeout/i').count();
      console.log('Error message count:', errorMessages);
      
      // Check what buttons are available now
      const buttons = await player1Page.locator('button').count();
      console.log('Button count:', buttons);
      
      // Get all button text
      const buttonTexts = await player1Page.locator('button').allTextContents();
      console.log('Button texts:', buttonTexts);
      
      // List all visible text
      const allText = await player1Page.locator('body').textContent();
      console.log('All visible text:', allText?.slice(0, 1000));
      
      // Check if there are any components that might indicate game state
      const gameStatus = await player1Page.locator('[class*="game"], [class*="status"], [class*="player"]').count();
      console.log('Game-related elements count:', gameStatus);
      
      // Check for loading indicators
      const loadingElements = await player1Page.locator('text=/loading|creating|joining|waiting/i').count();
      console.log('Loading indicators count:', loadingElements);
      
    } finally {
      await context1.close();
    }
  });
});