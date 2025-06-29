export interface ConnectionValidationResult {
  canConnect: boolean;
  reason?: string;
  shouldUseExistingConnection?: boolean;
  shouldUseExistingPromise?: boolean;
}

/**
 * Validates whether a WebSocket connection attempt should proceed
 * @param gameId - The gameId to connect to
 * @param currentGameId - The currently stored gameId
 * @param isConnected - Whether currently connected
 * @param isConnecting - Whether currently connecting
 * @param connectionPromise - Existing connection promise
 * @returns Validation result with recommendations
 */
export function validateConnectionAttempt(
  gameId: string | undefined,
  currentGameId: string | null,
  isConnected: boolean,
  isConnecting: boolean,
  connectionPromise: Promise<void> | null
): ConnectionValidationResult {
  // Don't allow connections without a gameId
  if (!gameId && !currentGameId) {
    return {
      canConnect: false,
      reason: 'Cannot connect to WebSocket without a gameId'
    };
  }

  // If already connecting or connected to the same gameId
  if (gameId && currentGameId === gameId) {
    if (isConnected) {
      return {
        canConnect: false,
        reason: 'Already connected to this game',
        shouldUseExistingConnection: true
      };
    }
    if (connectionPromise) {
      return {
        canConnect: false,
        reason: 'Connection already in progress',
        shouldUseExistingPromise: true
      };
    }
  }

  // Don't start a new connection if one is already in progress
  if (isConnecting) {
    return {
      canConnect: false,
      reason: 'Connection already in progress',
      shouldUseExistingPromise: true
    };
  }

  return {
    canConnect: true
  };
}
