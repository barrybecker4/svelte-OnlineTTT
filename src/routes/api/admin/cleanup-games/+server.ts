import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import type { GameState } from '$lib/types/game.ts';

/**
 * To preview what will be cleaned up use:
 * curl https://YOUR-PREVIEW.svelte-onlinettt.pages.dev/api/admin/cleanup-games
 * To do the cleanup:
 * curl -X POST https://YOUR-PREVIEW.svelte-onlinettt.pages.dev/api/admin/cleanup-games
 */
export const POST: RequestHandler = async ({ platform, request, url }) => {
  try {
    const kv = new KVStorage(platform!);

    // Get query parameters for filtering
    const deleteAll = url.searchParams.get('deleteAll') === 'true';
    const deleteOld = url.searchParams.get('deleteOld') === 'true';
    const olderThanHours = parseInt(url.searchParams.get('olderThanHours') || '24');

    // Get all game keys
    const gameKeys = await kv.list('game:');
    const openGamesKeys = await kv.list('open-games');

    console.log(`🔍 Found ${gameKeys.keys.length} game entries and ${openGamesKeys.keys.length} open-games entries to check`);

    let deletedCount = 0;
    let validCount = 0;
    let errorCount = 0;
    const deletedKeys: string[] = [];
    const errors: string[] = [];

    // Process individual games
    for (const key of gameKeys.keys) {
      try {
        const gameData: GameState = await kv.get(key.name) as GameState;

        if (!gameData) {
          console.log(`⚠️ Key ${key.name} has no data, deleting...`);
          await kv.delete(key.name);
          deletedCount++;
          deletedKeys.push(key.name);
          continue;
        }

        let shouldDelete = false;
        let reason = '';

        if (deleteAll) {
          shouldDelete = true;
          reason = 'deleteAll flag';
        } else if (deleteOld && gameData.createdAt) {
          const ageInHours = (Date.now() - gameData.createdAt) / (1000 * 60 * 60);
          if (ageInHours > olderThanHours) {
            shouldDelete = true;
            reason = `older than ${olderThanHours} hours (${ageInHours.toFixed(1)}h old)`;
          }
        } else {
          // Check for invalid/corrupted game states
          const hasValidStructure =
            gameData.gameId &&
            gameData.board &&
            gameData.status &&
            gameData.player1 &&
            gameData.player1.id &&
            gameData.player1.name;

          if (!hasValidStructure) {
            shouldDelete = true;
            reason = 'invalid structure';
          }
          // Check for stuck PENDING games older than 1 hour
          else if (gameData.status === 'PENDING' && gameData.createdAt) {
            const ageInHours = (Date.now() - gameData.createdAt) / (1000 * 60 * 60);
            if (ageInHours > 1) {
              shouldDelete = true;
              reason = `stuck PENDING game (${ageInHours.toFixed(1)}h old)`;
            }
          }
        }

        if (shouldDelete) {
          console.log(`🗑️ Deleting game (${reason}): ${key.name}`);
          console.log(`  - Game data:`, JSON.stringify(gameData, null, 2));

          await kv.delete(key.name);
          deletedCount++;
          deletedKeys.push(key.name);
        } else {
          console.log(`✅ Valid game kept: ${key.name} (status: ${gameData.status})`);
          validCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${key.name}:`, error);
        errors.push(`${key.name}: ${error.message}`);
        errorCount++;
      }
    }

    // Process open-games list
    for (const key of openGamesKeys.keys) {
      try {
        console.log(`🗑️ Deleting open-games list: ${key.name}`);
        await kv.delete(key.name);
        deletedCount++;
        deletedKeys.push(key.name);
      } catch (error) {
        console.error(`❌ Error deleting open-games list ${key.name}:`, error);
        errors.push(`${key.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`🎉 Game cleanup complete: ${deletedCount} deleted, ${validCount} kept, ${errorCount} errors`);

    return json({
      success: true,
      summary: {
        totalChecked: gameKeys.keys.length + openGamesKeys.keys.length,
        deleted: deletedCount,
        kept: validCount,
        errors: errorCount
      },
      deletedKeys,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Error during game cleanup:', error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};

// GET endpoint for preview/status
export const GET: RequestHandler = async ({ platform, url }) => {
  try {
    const kv = new KVStorage(platform!);
    const gameKeys = await kv.list('game:');
    const openGamesKeys = await kv.list('open-games');

    let validCount = 0;
    let pendingCount = 0;
    let activeCount = 0;
    let completedCount = 0;
    let invalidCount = 0;
    const invalidKeys: string[] = [];
    const oldGames: string[] = [];

    for (const key of gameKeys.keys) {
      try {
        const gameData: GameState = await kv.get(key.name) as GameState;

        if (!gameData) {
          invalidCount++;
          invalidKeys.push(key.name);
          continue;
        }

        const hasValidStructure =
          gameData.gameId &&
          gameData.board &&
          gameData.status &&
          gameData.player1 &&
          gameData.player1.id &&
          gameData.player1.name;

        if (!hasValidStructure) {
          invalidCount++;
          invalidKeys.push(key.name);
        } else {
          validCount++;

          // Categorize by status
          switch (gameData.status) {
            case 'PENDING':
              pendingCount++;
              break;
            case 'ACTIVE':
              activeCount++;
              break;
            default:
              completedCount++;
              break;
          }

          // Check age
          if (gameData.createdAt) {
            const ageInHours = (Date.now() - gameData.createdAt) / (1000 * 60 * 60);
            if (ageInHours > 24) {
              oldGames.push(`${key.name} (${ageInHours.toFixed(1)}h old, ${gameData.status})`);
            }
          }
        }
      } catch (error) {
        invalidCount++;
        invalidKeys.push(`${key.name} (error: ${error.message})`);
      }
    }

    return json({
      available: true,
      status: {
        totalGameEntries: gameKeys.keys.length,
        openGamesLists: openGamesKeys.keys.length,
        validGames: validCount,
        invalidGames: invalidCount,
        gamesByStatus: {
          pending: pendingCount,
          active: activeCount,
          completed: completedCount
        },
        oldGames: oldGames.length,
        invalidKeys: invalidKeys.slice(0, 10), // Show first 10 for preview
        oldGamesSample: oldGames.slice(0, 5) // Show first 5 old games
      },
      usage: {
        description: 'POST to this endpoint to clean up games',
        options: {
          'POST /api/admin/cleanup-games': 'Delete invalid games and stuck PENDING games',
          'POST /api/admin/cleanup-games?deleteOld=true': 'Delete games older than 24 hours',
          'POST /api/admin/cleanup-games?deleteOld=true&olderThanHours=1': 'Delete games older than 1 hour',
          'POST /api/admin/cleanup-games?deleteAll=true': 'Delete ALL games (nuclear option)'
        },
        examples: {
          preview: 'curl https://YOUR-PREVIEW.pages.dev/api/admin/cleanup-games',
          cleanup: 'curl -X POST https://YOUR-PREVIEW.pages.dev/api/admin/cleanup-games',
          deleteOld: 'curl -X POST "https://YOUR-PREVIEW.pages.dev/api/admin/cleanup-games?deleteOld=true"'
        }
      }
    });
  } catch (error) {
    return json({
      available: true,
      error: error.message
    });
  }
};
