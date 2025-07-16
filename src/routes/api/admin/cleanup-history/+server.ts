import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import type { GameHistory } from '$lib/types/game.ts';

/**
 * To preview what will be cleaned up use:
 * curl https://XXXXXXX.svelte-onlinettt.pages.dev/api/admin/cleanup-history
 * To do the cleanup:
 * curl -X POST https://XXXXXX.svelte-onlinettt.pages.dev/api/admin/cleanup-history
 */
export const POST: RequestHandler = async ({ platform, request }) => {
  try {
    const kv = new KVStorage(platform!);

    // Get all history keys
    const historyKeys = await kv.list('history:');

    console.log(`🔍 Found ${historyKeys.keys.length} history entries to check`);

    let deletedCount = 0;
    let validCount = 0;
    let errorCount = 0;
    const deletedKeys: string[] = [];
    const errors: string[] = [];

    for (const key of historyKeys.keys) {
      try {
        const historyData:GameHistory = await kv.get(key.name) as GameHistory;

        if (!historyData) {
          console.log(`⚠️ Key ${key.name} has no data, deleting...`);
          await kv.delete(key.name);
          deletedCount++;
          deletedKeys.push(key.name);
          continue;
        }

        // Check if it has the player1AsO property (assuming if it has this, it has proper structure)
        const hasPlayer1AsO =
          historyData.player1AsO && typeof historyData.player1AsO === 'object' && 'totalWins' in historyData.player1AsO;

        if (!hasPlayer1AsO) {
          console.log(`🗑️ Deleting history without player1AsO: ${key.name}`);
          console.log(`  - Data structure:`, JSON.stringify(historyData, null, 2));

          await kv.delete(key.name);
          deletedCount++;
          deletedKeys.push(key.name);
        } else {
          console.log(`✅ Valid history kept: ${key.name}`);
          validCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${key.name}:`, error);
        errors.push(`${key.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`🎉 Cleanup complete: ${deletedCount} deleted, ${validCount} kept, ${errorCount} errors`);

    return json({
      success: true,
      summary: {
        totalChecked: historyKeys.keys.length,
        deleted: deletedCount,
        kept: validCount,
        errors: errorCount
      },
      deletedKeys,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Error during history cleanup:', error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};

// Also support GET for info/status
export const GET: RequestHandler = async ({ platform }) => {
  try {
    const kv = new KVStorage(platform!);
    const historyKeys = await kv.list('history:');

    let validCount = 0;
    let invalidCount = 0;
    const invalidKeys: string[] = [];

    for (const key of historyKeys.keys) {
      try {
        const historyData: GameHistory = await kv.get(key.name) as GameHistory;

        if (!historyData) {
          invalidCount++;
          invalidKeys.push(key.name);
          continue;
        }

        const hasplayer1AsO = historyData.player1AsO &&
          typeof historyData.player1AsO === 'object' &&
          'totalWins' in historyData.player1AsO;

        if (hasplayer1AsO) {
          validCount++;
        } else {
          invalidCount++;
          invalidKeys.push(key.name);
        }
      } catch (error) {
        invalidCount++;
        invalidKeys.push(`${key.name} (error: ${error.message})`);
      }
    }

    return json({
      available: true,
      status: {
        totalHistoryEntries: historyKeys.keys.length,
        validEntries: validCount,
        invalidEntries: invalidCount,
        invalidKeys: invalidKeys.slice(0, 10) // Show first 10 for preview
      },
      usage: {
        description: 'POST to this endpoint to delete all history entries without player1AsO property',
        curlExample: 'curl -X POST https://your-app.pages.dev/api/admin/cleanup-history'
      }
    });
  } catch (error) {
    return json({
      available: true,
      error: error.message
    });
  }
};
