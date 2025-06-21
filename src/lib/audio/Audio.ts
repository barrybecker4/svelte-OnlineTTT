/**
 * Game Audio Service
 * Handles all audio effects for the Tic-Tac-Toe game
 */
class GameAudio {
  private audioContext: AudioContext | null = null;
  private volume: number = 1.0;

  /**
   * Get or create the audio context
   */
  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      return this.audioContext;
    } catch (error) {
      console.warn('Audio context not available:', error);
      return null;
    }
  }

  /**
   * Create a tone with specified frequency, duration, and volume
   */
  private async createTone(frequency: number, duration: number, volume: number): void {
    const audioContext = this.getAudioContext();
    if (!audioContext) return;

    // Resume AudioContext if it's suspended (required for game-end sounds)
    if (audioContext.state === 'suspended') {
      console.log('🔊 Resuming suspended AudioContext');
      await audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    const effectiveVolume = volume * this.volume;
    gainNode.gain.setValueAtTime(effectiveVolume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  /**
   * Play escalating warning sound for timer countdown
   * Gets higher in pitch and slightly louder as time decreases
   */
  playTimerWarning(secondsRemaining: number): void {
    if (secondsRemaining < 1 || secondsRemaining > 5) return;

    // Calculate frequency - higher pitch as time decreases
    const basePitch = 600;
    const urgencyMultiplier = (6 - secondsRemaining) * 100;
    const frequency = basePitch + urgencyMultiplier;

    // Calculate volume - slightly louder as urgency increases
    const baseVolume = 0.2;
    const urgencyVolume = (6 - secondsRemaining) * 0.05;
    const volume = Math.min(baseVolume + urgencyVolume, 0.45);

    // Play short, urgent beep
    this.createTone(frequency, 0.2, volume);
  }

  /**
   * Play confirmation sound when a move is made
   */
  playMoveSound(): void {
    this.createTone(440, 0.1, 0.3);
  }

  /**
   * Play victory sound when player wins
   */
  playGameWon(): void {
    setTimeout(() => this.createTone(523, 0.2, 0.4), 0); // C5
    setTimeout(() => this.createTone(659, 0.2, 0.4), 150); // E5
    setTimeout(() => this.createTone(784, 0.3, 0.5), 300); // G5
  }

  /**
   * Play defeat sound when player loses
   */
  playGameLost(): void {
    setTimeout(() => this.createTone(392, 0.2, 0.3), 0); // G4
    setTimeout(() => this.createTone(330, 0.2, 0.3), 150); // E4
    setTimeout(() => this.createTone(262, 0.4, 0.4), 300); // C4
  }

  /**
   * Play sound when a new player joins the game
   */
  playPlayerJoined(): void {
    this.createTone(659, 0.15, 0.3); // E5
    setTimeout(() => this.createTone(784, 0.15, 0.3), 100); // G5
  }

  /**
   * Play sound when game ends in a tie
   */
  playGameTie(): void {
    this.createTone(440, 0.3, 0.3); // A4
    setTimeout(() => this.createTone(440, 0.3, 0.3), 200); // A4 again
  }

  /**
   * Play error/invalid move sound
   */
  playErrorSound(): void {
    this.createTone(200, 0.2, 0.4);
  }
}

// Export singleton instance
export const gameAudio = new GameAudio();

// Export class for testing or advanced usage
export { GameAudio };
