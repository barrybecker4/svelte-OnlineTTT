/**  separates promise lifecycle management from WebSocket logic */
export class ConnectionPromise {
  private promise: Promise<void> | null = null;
  private resolve: (() => void) | null = null;
  private reject: ((error: Error) => void) | null = null;

  /**
   * Creates a new connection promise if one doesn't exist
   * @returns The connection promise
   */
  create(): Promise<void> {
    if (this.promise) {
      return this.promise;
    }

    this.promise = new Promise<void>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    return this.promise;
  }

  /**
   * Gets the existing promise or null
   */
  get(): Promise<void> | null {
    return this.promise;
  }

  /**
   * Resolves the current promise and clears it
   */
  resolveAndClear(): void {
    if (this.resolve) {
      this.resolve();
    }
    this.clear();
  }

  /**
   * Rejects the current promise with an error and clears it
   */
  rejectAndClear(error: Error): void {
    if (this.reject) {
      this.reject(error);
    }
    this.clear();
  }

  /**
   * Clears the promise without resolving/rejecting
   */
  clear(): void {
    this.promise = null;
    this.resolve = null;
    this.reject = null;
  }

  /**
   * Returns true if a promise exists
   */
  exists(): boolean {
    return this.promise !== null;
  }
}
