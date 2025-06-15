export class KVStorage {
	private kv: KVNamespace | null;

	constructor(platform?: App.Platform) {
		this.kv = platform?.env?.TTT_GAME_KV || null;
	}

	async get<T>(key: string): Promise<T | null> {
		if (!this.kv) {
			console.log('KV not available, using mock storage');
			return null; // Mock behavior for development
		}
		const value = await this.kv.get(key);
		return value ? JSON.parse(value) : null;
	}

	async put<T>(key: string, value: T, expirationTtl?: number): Promise<void> {
		if (!this.kv) {
			console.log('KV not available, mock putting:', key);
			return; // Mock behavior for development
		}
		const options = expirationTtl ? { expirationTtl } : undefined;
		await this.kv.put(key, JSON.stringify(value), options);
	}

	async delete(key: string): Promise<void> {
		if (!this.kv) {
			console.log('KV not available, mock deleting:', key);
			return;
		}
		await this.kv.delete(key);
	}

	async list(prefix?: string): Promise<KVNamespaceListResult<unknown, string>> {
		if (!this.kv) {
			console.log('KV not available, returning empty list');
			return { keys: [], list_complete: true, cursor: '' };
		}
		return await this.kv.list({ prefix });
	}
}
