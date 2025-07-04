import type { GameState } from '$lib/types/game.js';
import { WebSocketNotificationService } from './WebSocketNotificationService.js';

/**
 * Helper class to abstract WebSocket notification logic for different environments
 */
export class WebSocketNotificationHelper {

  /**
   * Send a game update notification, handling both local and production environments
   */
  static async sendGameUpdate(
    gameState: GameState,
    platform: any,
    context: string = 'game update'
  ): Promise<void> {
    const isLocalDevelopment = !platform?.env.WEBSOCKET_HIBERNATION_SERVER;

    try {
      if (platform?.env.WEBSOCKET_HIBERNATION_SERVER) {
        console.log(`🚀 PRODUCTION: Sending ${context} WebSocket notification...`);
        await WebSocketNotificationService.notifyGameUpdate(
          gameState.gameId,
          gameState,
          platform.env.WEBSOCKET_HIBERNATION_SERVER
        );
        console.log(`✅ Production ${context} WebSocket notification sent successfully`);
      } else {
        console.log(`🏠 LOCAL DEV: Sending ${context} notification to local WebSocket worker...`);
        await WebSocketNotificationService.notifyGameUpdate(
          gameState.gameId,
          gameState,
          'http://localhost:8787'
        );
        console.log(`✅ Local ${context} WebSocket notification sent successfully`);
      }
    } catch (error) {
      console.error(`❌ Failed to send ${context} WebSocket notification:`, error);
      // Don't fail the request if WebSocket notification fails
    }
  }

  /**
   * Send a player joined notification, handling both local and production environments
   */
  static async sendPlayerJoined(
    gameState: GameState,
    platform: any
  ): Promise<void> {
    const isLocalDevelopment = !platform?.env.WEBSOCKET_HIBERNATION_SERVER;

    try {
      if (platform?.env.WEBSOCKET_HIBERNATION_SERVER) {
        console.log('🚀 PRODUCTION: Sending player joined WebSocket notification...');
        await WebSocketNotificationService.notifyPlayerJoined(
          gameState.gameId,
          gameState,
          platform.env.WEBSOCKET_HIBERNATION_SERVER
        );
        console.log('✅ Production player joined WebSocket notification sent successfully');
      } else {
        console.log('🏠 LOCAL DEV: Sending player joined notification to local WebSocket worker...');
        await WebSocketNotificationService.notifyPlayerJoined(
          gameState.gameId,
          gameState,
          'http://localhost:8787'
        );
        console.log('✅ Local player joined WebSocket notification sent successfully');
      }
    } catch (error) {
      console.error('❌ Failed to send player joined WebSocket notification:', error);
      // Don't fail the request if WebSocket notification fails
    }
  }

  /**
   * Check if WebSocket notifications are available in the current environment
   */
  static isWebSocketAvailable(platform: any): boolean {
    return !!platform?.env.WEBSOCKET_HIBERNATION_SERVER || true; // Always true for local dev too
  }

  /**
   * Get environment info for debugging
   */
  static getEnvironmentInfo(platform: any) {
    const isLocalDevelopment = !platform?.env.WEBSOCKET_HIBERNATION_SERVER;
    return {
      isLocalDevelopment,
      webSocketNotificationsAvailable: true,
      hasWebSocketBinding: !!platform?.env.WEBSOCKET_HIBERNATION_SERVER
    };
  }
}
