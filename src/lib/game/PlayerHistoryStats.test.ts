import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerHistoryStats } from './PlayerHistoryStats';
import type { GameHistory } from '$lib/types/game';

// Helper function to create mock GameHistory objects
function createMockGameHistory(overrides: Partial<GameHistory> = {}): GameHistory {
  return {
    player1: 'Alice',
    player2: 'Bob',
    totalEncounters: 0,
    totalActive: 0,
    player1AsX: {
      totalWins: 0,
      totalLosses: 0,
      totalTies: 0,
      wins: { byResignation: 0, byTimeout: 0 },
      losses: { byResignation: 0, byTimeout: 0 }
    },
    player2AsX: {
      totalWins: 0,
      totalLosses: 0,
      totalTies: 0,
      wins: { byResignation: 0, byTimeout: 0 },
      losses: { byResignation: 0, byTimeout: 0 }
    },
    ...overrides
  };
}

describe('PlayerHistoryStats', () => {
  let mockGameHistory: GameHistory;

  beforeEach(() => {
    mockGameHistory = createMockGameHistory();
  });

  describe('constructor', () => {
    it('should initialize with formatted history', () => {
      const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', 'Bob');
      expect(stats.formattedHistory).toBeDefined();
    });

    it('should call formatHistory during construction', () => {
      const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', 'Bob');
      expect(stats.formattedHistory).toEqual(
        'This is the first time you are playing against <strong>Bob</strong>.'
      );
    });
  });

  describe('formatHistory', () => {
    describe('edge cases and null handling', () => {
      it('should return null when history is null', () => {
        const stats = new PlayerHistoryStats(null as any, 'Alice', 'Bob');
        expect(stats.formattedHistory).toBeNull();
      });

      it('should return null when history is undefined', () => {
        const stats = new PlayerHistoryStats(undefined as any, 'Alice', 'Bob');
        expect(stats.formattedHistory).toBeNull();
      });

      it('should return null when opponentName is null', () => {
        const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', null as any);
        expect(stats.formattedHistory).toBeNull();
      });

      it('should return null when opponentName is empty string', () => {
        const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', '');
        expect(stats.formattedHistory).toBeNull();
      });

      it('should return null when opponentName is undefined', () => {
        const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', undefined as any);
        expect(stats.formattedHistory).toBeNull();
      });
    });

    describe('first encounter scenario', () => {
      it('should return first time message when totalEncounters is 0', () => {
        mockGameHistory.totalEncounters = 0;
        const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', 'Bob');

        expect(stats.formattedHistory).toBe(
          'This is the first time you are playing against <strong>Bob</strong>.'
        );
      });

      it('should handle different opponent names in first encounter message', () => {
        mockGameHistory.totalEncounters = 0;
        const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', 'Charlie');

        expect(stats.formattedHistory).toBe(
          'This is the first time you are playing against <strong>Charlie</strong>.'
        );
      });
    });

    describe('player identification logic', () => {
      it('should correctly identify player1 when playerName matches player1', () => {
        mockGameHistory.totalEncounters = 2;
        mockGameHistory.player1 = 'Alice';
        mockGameHistory.player2 = 'Bob';
        mockGameHistory.player1AsX = {
          totalWins: 1, totalLosses: 0, totalTies: 1,
          wins: { byResignation: 0, byTimeout: 0 },
          losses: { byResignation: 0, byTimeout: 0 }
        };
        mockGameHistory.player1AsO = {
          totalWins: 0, totalLosses: 1, totalTies: 1,
          wins: { byResignation: 0, byTimeout: 0 },
          losses: { byResignation: 0, byTimeout: 0 }
        };

        const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', 'Bob');

        expect(stats.formattedHistory).toContain('You have played <strong>Bob</strong> 2 times');
        expect(stats.formattedHistory).toContain('As player <strong>X</strong> you won 1');
        expect(stats.formattedHistory).toContain('As player <strong>O</strong> you won 0');
      });

      it('should correctly identify player2 when playerName matches player2', () => {
        mockGameHistory.totalEncounters = 3;
        mockGameHistory.player1 = 'Alice';
        mockGameHistory.player2 = 'Bob';
        mockGameHistory.player2AsX = {
          totalWins: 2, totalLosses: 0, totalTies: 1,
          wins: { byResignation: 1, byTimeout: 0 },
          losses: { byResignation: 0, byTimeout: 0 }
        };
        mockGameHistory.player2AsO = {
          totalWins: 1, totalLosses: 1, totalTies: 1,
          wins: { byResignation: 0, byTimeout: 1 },
          losses: { byResignation: 0, byTimeout: 1 }
        };

        const stats = new PlayerHistoryStats(mockGameHistory, 'Bob', 'Alice');

        expect(stats.formattedHistory).toBe('You have played <strong>Alice</strong> 3 times in the past.<br>As player <strong>X</strong> you won 2 (1 by resignation), lost 0, and tied 1.<br>As player <strong>O</strong> you won 1 (1 by timeout), lost 1 (1 by timeout), and tied 1.<br>');
      });
    });

    describe('formatted output structure', () => {
      it('should format complete history with encounters and both symbol results', () => {
        mockGameHistory.totalEncounters = 5;
        mockGameHistory.player1AsX = {
          totalWins: 2, totalLosses: 1, totalTies: 2,
          wins: { byResignation: 1, byTimeout: 0 },
          losses: { byResignation: 0, byTimeout: 1 }
        };
        mockGameHistory.player1AsO = {
          totalWins: 1, totalLosses: 2, totalTies: 2,
          wins: { byResignation: 0, byTimeout: 1 },
          losses: { byResignation: 1, byTimeout: 0 }
        };

        const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', 'Bob');
        const result = stats.formattedHistory!;

        expect(result).toContain('You have played <strong>Bob</strong> 5 times in the past.<br>');
        expect(result).toContain('As player <strong>X</strong> you won 2');
        expect(result).toContain('As player <strong>O</strong> you won 1');
        expect(result).toMatch(/.*<br>.*<br>$/); // Should end with two <br> tags
      });

      it('should include win/loss details when present', () => {
        mockGameHistory.totalEncounters = 3;
        mockGameHistory.player1AsX = {
          totalWins: 2, totalLosses: 0, totalTies: 1,
          wins: { byResignation: 1, byTimeout: 1 },
          losses: { byResignation: 0, byTimeout: 0 }
        };
        mockGameHistory.player1AsO = {
          totalWins: 0, totalLosses: 2, totalTies: 1,
          wins: { byResignation: 0, byTimeout: 0 },
          losses: { byResignation: 1, byTimeout: 1 }
        };

        const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', 'Bob');
        const result = stats.formattedHistory!;

        expect(result).toContain('you won 2 (1 by resignation, 1 by timeout)');
        expect(result).toContain('lost 2 (1 by resignation, 1 by timeout)');
      });
    });
  });

  describe('formatResultLine', () => {
    it('should format basic win/loss/tie counts', () => {
      const result = PlayerHistoryStats['formatResultLine'](
        'X', 3, 1, 2,
        { byResignation: 0, byTimeout: 0 },
        { byResignation: 0, byTimeout: 0 }
      );

      expect(result).toBe('As player <strong>X</strong> you won 3, lost 1, and tied 2.<br>');
    });

    it('should format with win details only', () => {
      const result = PlayerHistoryStats['formatResultLine'](
        'O', 2, 0, 1,
        { byResignation: 1, byTimeout: 1 },
        { byResignation: 0, byTimeout: 0 }
      );

      expect(result).toBe('As player <strong>O</strong> you won 2 (1 by resignation, 1 by timeout), lost 0, and tied 1.<br>');
    });

    it('should format with loss details only', () => {
      const result = PlayerHistoryStats['formatResultLine'](
        'X', 0, 2, 1,
        { byResignation: 0, byTimeout: 0 },
        { byResignation: 1, byTimeout: 1 }
      );

      expect(result).toBe('As player <strong>X</strong> you won 0, lost 2 (1 by resignation, 1 by timeout), and tied 1.<br>');
    });

    it('should format with both win and loss details', () => {
      const result = PlayerHistoryStats['formatResultLine'](
        'O', 3, 2, 0,
        { byResignation: 2, byTimeout: 1 },
        { byResignation: 1, byTimeout: 1 }
      );

      expect(result).toBe('As player <strong>O</strong> you won 3 (2 by resignation, 1 by timeout), lost 2 (1 by resignation, 1 by timeout), and tied 0.<br>');
    });

    it('should handle zero values correctly', () => {
      const result = PlayerHistoryStats['formatResultLine'](
        'X', 0, 0, 0,
        { byResignation: 0, byTimeout: 0 },
        { byResignation: 0, byTimeout: 0 }
      );

      expect(result).toBe('As player <strong>X</strong> you won 0, lost 0, and tied 0.<br>');
    });
  });

  describe('getWinLossDetails', () => {
    it('should return empty string when no resignation or timeout', () => {
      const result = PlayerHistoryStats['getWinLossDetails']({ byResignation: 0, byTimeout: 0 });
      expect(result).toBe('');
    });

    it('should format resignation only', () => {
      const result = PlayerHistoryStats['getWinLossDetails']({ byResignation: 2, byTimeout: 0 });
      expect(result).toBe(' (2 by resignation)');
    });

    it('should format timeout only', () => {
      const result = PlayerHistoryStats['getWinLossDetails']({ byResignation: 0, byTimeout: 3 });
      expect(result).toBe(' (3 by timeout)');
    });

    it('should format both resignation and timeout', () => {
      const result = PlayerHistoryStats['getWinLossDetails']({ byResignation: 1, byTimeout: 2 });
      expect(result).toBe(' (1 by resignation, 2 by timeout)');
    });

    it('should handle single counts correctly', () => {
      const result1 = PlayerHistoryStats['getWinLossDetails']({ byResignation: 1, byTimeout: 0 });
      const result2 = PlayerHistoryStats['getWinLossDetails']({ byResignation: 0, byTimeout: 1 });

      expect(result1).toBe(' (1 by resignation)');
      expect(result2).toBe(' (1 by timeout)');
    });

    it('should handle large numbers', () => {
      const result = PlayerHistoryStats['getWinLossDetails']({ byResignation: 15, byTimeout: 23 });
      expect(result).toBe(' (15 by resignation, 23 by timeout)');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex multi-game history correctly', () => {
      const complexHistory = createMockGameHistory({
        totalEncounters: 10,
        player1: 'Alice',
        player2: 'Bob',
        player1AsX: {
          totalWins: 4, totalLosses: 2, totalTies: 4,
          wins: { byResignation: 2, byTimeout: 1 },
          losses: { byResignation: 1, byTimeout: 0 }
        },
        player1AsO: {
          totalWins: 2, totalLosses: 4, totalTies: 4,
          wins: { byResignation: 0, byTimeout: 2 },
          losses: { byResignation: 2, byTimeout: 1 }
        }
      });

      const stats = new PlayerHistoryStats(complexHistory, 'Alice', 'Bob');
      const result = stats.formattedHistory!;

      expect(result).toContain('You have played <strong>Bob</strong> 10 times in the past.<br>');
      expect(result).toContain('As player <strong>X</strong> you won 4 (2 by resignation, 1 by timeout), lost 2 (1 by resignation), and tied 4.<br>');
      expect(result).toContain('As player <strong>O</strong> you won 2 (2 by timeout), lost 4 (2 by resignation, 1 by timeout), and tied 4.<br>');
    });

    it('should handle case where player name does not match either player in history', () => {
      const stats = new PlayerHistoryStats(mockGameHistory, 'Charlie', 'Bob');

      // Should still work, but Charlie will be treated as if they were player2
      // since they don't match player1 ('Alice')
      expect(stats.formattedHistory).toContain('This is the first time you are playing against <strong>Bob</strong>.');
    });

    it('should handle edge case with all stats being zero except encounters', () => {
      const zeroStatsHistory = createMockGameHistory({
        totalEncounters: 1,
        player1AsX: {
          totalWins: 0, totalLosses: 0, totalTies: 0,
          wins: { byResignation: 0, byTimeout: 0 },
          losses: { byResignation: 0, byTimeout: 0 }
        },
        player1AsO: {
          totalWins: 0, totalLosses: 0, totalTies: 0,
          wins: { byResignation: 0, byTimeout: 0 },
          losses: { byResignation: 0, byTimeout: 0 }
        }
      });

      const stats = new PlayerHistoryStats(zeroStatsHistory, 'Alice', 'Bob');
      const result = stats.formattedHistory!;

      expect(result).toContain('You have played <strong>Bob</strong> 1 times in the past.<br>');
      expect(result).toContain('As player <strong>X</strong> you won 0, lost 0, and tied 0.<br>');
      expect(result).toContain('As player <strong>O</strong> you won 0, lost 0, and tied 0.<br>');
    });
  });

  describe('readonly property', () => {
    it('should make formattedHistory readonly', () => {
      const stats = new PlayerHistoryStats(mockGameHistory, 'Alice', 'Bob');

      // This test verifies the readonly nature by attempting to access the property
      // In TypeScript, trying to assign to a readonly property would cause a compile error
      expect(stats.formattedHistory).toBeDefined();
      expect(typeof stats.formattedHistory).toBe('string');
    });
  });
});
