import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.ts';
import { KVStorage } from '$lib/storage/kv.ts';
import { HistoryStorage } from '$lib/storage/history.ts';

interface HistoryRequest {
  player1: string;
  player2: string;
}

export const POST: RequestHandler = async ({ request, platform }) => {
    const { player1, player2 } = await request.json() as HistoryRequest;

    if (!player1 || !player2) {
      return json({ error: 'Both player names are required' }, { status: 400 });
    }

    return getHistory(player1, player2, platform);
};

// Alternative: GET with query parameters
export const GET: RequestHandler = async ({ url, platform }) => {
  const player1 = url.searchParams.get('player1');
  const player2 = url.searchParams.get('player2');

  if (!player1 || !player2) {
    return json({ error: 'Both player1 and player2 query parameters are required' }, { status: 400 });
  }

  return getHistory(player1, player2, platform);
};

async function getHistory(player1: string, player2: string,
                          platform: Readonly<App.Platform> | undefined): Promise<Response> {
  try {
    const kv = new KVStorage(platform!);
    const historyStorage = new HistoryStorage(kv);

    const history = await historyStorage.getHistory(player1, player2);

    return json(history);
  } catch (error) {
    console.error('Error fetching game history:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
