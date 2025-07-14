export class TestUtils {
  /**
   * Generate unique player names for test isolation
   * Uses test name + timestamp to ensure uniqueness across test runs
   */
  static generateUniquePlayerNames(testName: string): { player1: string; player2: string } {
    const timestamp = Date.now();
    const sanitizedTestName = testName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);

    return {
      player1: `P1_${sanitizedTestName}_${timestamp}`,
      player2: `P2_${sanitizedTestName}_${timestamp}`
    };
  }

  /**
   * Generate a unique test identifier for this test run
   */
  static generateTestId(testName: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const sanitizedTestName = testName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);

    return `${sanitizedTestName}_${timestamp}_${random}`;
  }

  /**
   * Setup player with unique name and clean localStorage
   */
  static async setupPlayer(page: any, playerName: string): Promise<void> {
    await page.goto('/');
    await page.evaluate((name) => {
      localStorage.clear(); // Clear any previous data
      localStorage.setItem('ttt-player-name', name);
    }, playerName);
    await page.reload();
    await page.waitForTimeout(500);
  }
}

// Usage example:
// const { player1, player2 } = TestUtils.generateUniquePlayerNames('play-newgame-test');
// await TestUtils.setupPlayer(player1Page, player1);
// await TestUtils.setupPlayer(player2Page, player2);
