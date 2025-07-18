import type { GameHistory, WinLossDetails } from '$lib/types/game';

export class PlayerHistoryStats {

  public readonly formattedHistory: string | null;

  constructor(gameHistory: GameHistory, playerName: string, opponentName: string) {
    this.formattedHistory = this.formatHistory(gameHistory, playerName, opponentName);
  }

  formatHistory(history: GameHistory, playerName: string, opponentName: string): string | null {
    if (!history || !opponentName) {
      return null;
    }
    if (history.totalEncounters === 0) {
      return `This is the first time you are playing against <strong>${opponentName}</strong>.`;
    }

    let text = `You have played <strong>${opponentName}</strong> ${history.totalEncounters} times in the past.<br>`;

    // Determine which stats apply to current player
    const isPlayer1 = history.player1 === playerName;
    const playerAsX = (isPlayer1 ? history.player1AsX : history.player2AsX) || this.createEmptyPlayerStats();
    const playerAsO = (isPlayer1 ? history.player1AsO : history.player2AsO) || this.createEmptyPlayerStats();

    if (!playerAsX || !playerAsO) {
      throw new Error(`playerAsX = ${playerAsX}, playerAsO = ${playerAsO}`);
    }
    text += PlayerHistoryStats.formatResultLine(
      'X',
      playerAsX.totalWins,
      playerAsX.totalLosses,
      playerAsX.totalTies,
      playerAsX.wins,
      playerAsX.losses
    );
    text += PlayerHistoryStats.formatResultLine(
      'O',
      playerAsO.totalWins,
      playerAsO.totalLosses,
      playerAsO.totalTies,
      playerAsO.wins,
      playerAsO.losses
    );

    return text;
  }

  private static formatResultLine(
    symbol: string,
    wins: number,
    losses: number,
    ties: number,
    winDetails: WinLossDetails,
    lossDetails: WinLossDetails
  ): string {
    const winParen = PlayerHistoryStats.getWinLossDetails(winDetails);
    const lossParen = PlayerHistoryStats.getWinLossDetails(lossDetails);

    return `As player <strong>${symbol}</strong> you won ${wins}${winParen}, lost ${losses}${lossParen}, and tied ${ties}.<br>`;
  }

  private static getWinLossDetails(details: WinLossDetails): string {
    if (details.byResignation + details.byTimeout === 0) {
      return '';
    }

    let result = ' (';
    const parts = [];

    if (details.byResignation) {
      parts.push(`${details.byResignation} by resignation`);
    }
    if (details.byTimeout) {
      parts.push(`${details.byTimeout} by timeout`);
    }

    result += parts.join(', ') + ')';
    return result;
  }

  private createEmptyPlayerStats() {
    return {
      totalWins: 0,
      totalLosses: 0,
      totalTies: 0,
      wins: {
        byResignation: 0,
        byTimeout: 0
      },
      losses: {
        byResignation: 0,
        byTimeout: 0
      }
    };
  }
}
