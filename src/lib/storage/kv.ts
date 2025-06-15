export class KVStorage {
	private kv: KVNamespace;

	constructor(platform: App.Platform) {
		this.kv = platform.env.TTT_GAME_KV;
	}

	async get<T>(key: string): Promise<T | null> {
		const value = await this.kv.get(key);
		return value ? JSON.parse(value) : null;
	}

	async put<T>(key: string, value: T, expirationTtl?: number): Promise<void> {
		const options = expirationTtl ? { expirationTtl } : undefined;
		await this.kv.put(key, JSON.stringify(value), options);
	}

	async delete(key: string): Promise<void> {
		await this.kv.delete(key);
	}

	async list(prefix?: string): Promise<KVNamespaceListResult<unknown, string>> {
		return await this.kv.list({ prefix });
	}
}