// Simple in-memory storage for development
const mockStorage = new Map<string, string>();

export class KVStorage {
  private kv: KVNamespace | null;
  private useMock: boolean;

  constructor(platform?: App.Platform) {
    this.kv = platform?.env?.TTT_GAME_KV || null;
    this.useMock = !this.kv;

    if (this.useMock) {
      console.log('🔧 Using mock KV storage for development');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useMock) {
      const value = mockStorage.get(key);
      return value ? JSON.parse(value) : null;
    }

    const value = await this.kv!.get(key);
    return value ? JSON.parse(value) : null;
  }

  async put<T>(key: string, value: T, expirationTtl?: number): Promise<void> {
    if (this.useMock) {
      mockStorage.set(key, JSON.stringify(value));
      // Simulate TTL by setting a timeout to delete
      if (expirationTtl) {
        setTimeout(() => mockStorage.delete(key), expirationTtl * 1000);
      }
      return;
    }

    const options = expirationTtl ? { expirationTtl } : undefined;
    await this.kv!.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    if (this.useMock) {
      mockStorage.delete(key);
      return;
    }

    await this.kv!.delete(key);
  }

  async list(prefix?: string): Promise<KVNamespaceListResult<unknown, string>> {
    if (this.useMock) {
      const keys = Array.from(mockStorage.keys())
        .filter((key) => !prefix || key.startsWith(prefix))
        .map((name) => ({ name }));
      return { keys, list_complete: true, cursor: '' };
    }

    return await this.kv!.list({ prefix });
  }
}
