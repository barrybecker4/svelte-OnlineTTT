import { describe, it, expect } from 'vitest';
import { makeMove, getOtherPlayer, createEmptyBoard } from './logic.ts';

describe('TTT Game Logic', () => {
  it('should make a valid move', () => {
    const board = createEmptyBoard();
    const result = makeMove('X', 0, board);

    expect(result.boardData).toBe('X________');
    expect(result.status).toBe('ACTIVE');
    expect(result.nextPlayer).toBe('O');
    expect(result.winningPositions).toBe(null);
  });

  it('should detect a win', () => {
    const board = 'XX_______';
    const result = makeMove('X', 2, board);

    expect(result.status).toBe('X_WIN');
    expect(result.winningPositions).toEqual([0, 1, 2]);
  });

  //  XOX
  //  OXO
  //  OX_
  it('should detect a tie', () => {
    const board = 'XOXOXOOX_';
    const result = makeMove('O', 8, board);

    expect(result.status).toBe('TIE');
    expect(result.winningPositions).toBe(null);
  });

  it('should throw error for occupied cell', () => {
    const board = 'X________';

    expect(() => makeMove('O', 0, board)).toThrow('Cannot play in occupied position');
  });

  it('should get other player correctly', () => {
    expect(getOtherPlayer('X')).toBe('O');
    expect(getOtherPlayer('O')).toBe('X');
  });
});
