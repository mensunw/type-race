'use client';

import { Player, PredictedState, SerializedPlayer, MultiplayerGameState } from '@/types/multiplayer';

export interface GameSyncState {
  serverState: GameState;
  predictedState: PredictedState;
  pendingInputs: InputSequence[];
  lastConfirmedSequence: number;
  clockOffset: number;
}

export interface GameState {
  gameState: MultiplayerGameState;
  players: Map<string, Player>;
  textContent: string;
  targetCharCount: number;
  startTime?: number;
  serverTime: number;
}

export interface InputSequence {
  sequenceNumber: number;
  timestamp: number;
  playerId: string;
  input: string;
  wordIndex: number;
  localTimestamp: number;
}

export class GameSynchronizer {
  private syncState: GameSyncState;
  private sequenceNumber: number = 0;
  private readonly playerId: string;

  constructor(playerId: string) {
    this.playerId = playerId;
    this.syncState = {
      serverState: {
        gameState: 'waiting',
        players: new Map(),
        textContent: '',
        targetCharCount: 0,
        serverTime: Date.now()
      },
      predictedState: {
        correctChars: 0,
        currentWordIndex: 0,
        currentWordInput: '',
        completedWords: [],
        timestamp: Date.now(),
        confirmed: true
      },
      pendingInputs: [],
      lastConfirmedSequence: -1,
      clockOffset: 0
    };
  }

  // Client-side prediction for immediate feedback
  public predictiveUpdate(
    input: string,
    wordIndex: number,
    textWords: string[]
  ): PredictedState {
    const sequence: InputSequence = {
      sequenceNumber: this.sequenceNumber++,
      timestamp: this.getServerTime(),
      playerId: this.playerId,
      input,
      wordIndex,
      localTimestamp: Date.now()
    };

    // Store input for later reconciliation
    this.syncState.pendingInputs.push(sequence);

    // Predict new state
    const newState = this.calculateTypingState(
      this.syncState.predictedState,
      input,
      wordIndex,
      textWords
    );

    this.syncState.predictedState = {
      ...newState,
      timestamp: sequence.timestamp,
      confirmed: false
    };

    return this.syncState.predictedState;
  }

  // Reconcile client prediction with authoritative server state
  public reconcileWithServer(
    serverPlayer: SerializedPlayer,
    serverTimestamp: number,
    confirmedSequence: number
  ): PredictedState {
    // Update clock offset
    this.updateClockOffset(serverTimestamp);

    // Mark confirmed inputs
    this.syncState.lastConfirmedSequence = confirmedSequence;

    // Remove confirmed inputs from pending list
    this.syncState.pendingInputs = this.syncState.pendingInputs.filter(
      input => input.sequenceNumber > confirmedSequence
    );

    // If server state matches our prediction, we're good
    if (this.isPredictionAccurate(serverPlayer)) {
      this.syncState.predictedState.confirmed = true;
      return this.syncState.predictedState;
    }

    // Reconcile: start from server state and replay pending inputs
    const reconciledState = this.replayPendingInputs(serverPlayer);

    this.syncState.predictedState = {
      ...reconciledState,
      timestamp: this.getServerTime(),
      confirmed: false
    };

    return this.syncState.predictedState;
  }

  // Synchronize countdown with server time compensation
  public syncCountdown(
    phase: number,
    serverTimestamp: number
  ): { phase: number; timeRemaining: number } {
    this.updateClockOffset(serverTimestamp);

    // Each countdown phase lasts 1 second
    const currentServerTime = this.getServerTime();
    const phaseStartTime = serverTimestamp - (3 - phase) * 1000;
    const timeInCurrentPhase = currentServerTime - phaseStartTime;

    // Calculate actual phase and remaining time
    const actualPhase = Math.max(0, 3 - Math.floor((currentServerTime - serverTimestamp + 3000) / 1000));
    const timeRemaining = Math.max(0, 1000 - (timeInCurrentPhase % 1000));

    return { phase: actualPhase, timeRemaining };
  }

  // Update game state from server
  public updateServerState(
    gameState: MultiplayerGameState,
    players: SerializedPlayer[],
    serverTimestamp: number
  ): void {
    this.updateClockOffset(serverTimestamp);

    this.syncState.serverState = {
      ...this.syncState.serverState,
      gameState,
      players: new Map(players.map(p => [p.id, this.deserializePlayer(p)])),
      serverTime: serverTimestamp
    };
  }

  // Detect network lag for UI adjustments
  public detectNetworkLag(): number {
    if (this.syncState.pendingInputs.length === 0) return 0;

    const oldestInput = this.syncState.pendingInputs[0];
    const lagTime = Date.now() - oldestInput.localTimestamp;

    // Return lag in milliseconds, capped at 1000ms
    return Math.min(lagTime, 1000);
  }

  public getPendingInputs(): InputSequence[] {
    return [...this.syncState.pendingInputs];
  }

  public getServerTime(): number {
    return Date.now() + this.syncState.clockOffset;
  }

  public getGameState(): GameState {
    return { ...this.syncState.serverState };
  }

  public getPredictedState(): PredictedState {
    return { ...this.syncState.predictedState };
  }

  private calculateTypingState(
    currentState: PredictedState,
    input: string,
    wordIndex: number,
    textWords: string[]
  ): PredictedState {
    if (wordIndex >= textWords.length) {
      return currentState; // No more words
    }

    const expectedWord = textWords[wordIndex];
    const isCorrect = input === expectedWord;

    // If this is a word completion (space pressed or exact match)
    if (isCorrect && wordIndex > currentState.currentWordIndex) {
      const newCompletedWords = [...currentState.completedWords];

      // Add all words between current and new position
      for (let i = currentState.currentWordIndex; i < wordIndex; i++) {
        newCompletedWords.push(textWords[i]);
      }

      const correctChars = newCompletedWords.reduce(
        (sum, word) => sum + word.length,
        0
      ) + newCompletedWords.length - 1; // Add spaces

      return {
        correctChars,
        currentWordIndex: wordIndex,
        currentWordInput: '',
        completedWords: newCompletedWords,
        timestamp: Date.now(),
        confirmed: false
      };
    }

    // Update current word input
    const correctPortion = expectedWord.substring(0,
      Math.min(input.length, expectedWord.length)
    );

    const correctInCurrentWord = input.substring(0, correctPortion.length) === correctPortion
      ? correctPortion.length
      : 0;

    const correctChars = currentState.completedWords.reduce(
      (sum, word) => sum + word.length,
      0
    ) + Math.max(0, currentState.completedWords.length - 1) + correctInCurrentWord;

    return {
      correctChars,
      currentWordIndex: wordIndex,
      currentWordInput: input,
      completedWords: currentState.completedWords,
      timestamp: Date.now(),
      confirmed: false
    };
  }

  private isPredictionAccurate(serverPlayer: SerializedPlayer): boolean {
    const tolerance = 1; // Allow 1 character difference

    return (
      Math.abs(this.syncState.predictedState.correctChars - serverPlayer.correctChars) <= tolerance &&
      this.syncState.predictedState.currentWordIndex === serverPlayer.currentWordIndex
    );
  }

  private replayPendingInputs(serverPlayer: SerializedPlayer): PredictedState {
    let state: PredictedState = {
      correctChars: serverPlayer.correctChars,
      currentWordIndex: serverPlayer.currentWordIndex,
      currentWordInput: '',
      completedWords: [], // Would need to be provided by server
      timestamp: this.getServerTime(),
      confirmed: false
    };

    // Replay all pending inputs on top of server state
    for (const input of this.syncState.pendingInputs) {
      // This would need access to text words - simplified for now
      // In real implementation, text state would be part of the sync state
      state = {
        ...state,
        currentWordInput: input.input,
        currentWordIndex: input.wordIndex
      };
    }

    return state;
  }

  private updateClockOffset(serverTimestamp: number): void {
    const networkDelay = this.estimateNetworkDelay();
    const adjustedServerTime = serverTimestamp + networkDelay / 2;

    this.syncState.clockOffset = adjustedServerTime - Date.now();
  }

  private estimateNetworkDelay(): number {
    // Simple estimation - in production could use more sophisticated methods
    return Math.min(this.detectNetworkLag(), 100); // Cap at 100ms
  }

  private deserializePlayer(serialized: SerializedPlayer): Player {
    return {
      ...serialized,
      completedWords: [], // Would need to be included in serialized data
      currentWordInput: '' // Would need to be included in serialized data
    };
  }
}

// Utility functions for game synchronization
export const createGameSynchronizer = (playerId: string): GameSynchronizer => {
  return new GameSynchronizer(playerId);
};

export const calculateWPM = (
  correctChars: number,
  elapsedTimeMs: number
): number => {
  if (elapsedTimeMs === 0) return 0;

  const minutes = elapsedTimeMs / 60000;
  const words = correctChars / 5; // Standard: 5 characters = 1 word

  return Math.round(words / minutes);
};

export const calculateAccuracy = (
  correctChars: number,
  totalChars: number
): number => {
  if (totalChars === 0) return 100;
  return Math.round((correctChars / totalChars) * 100);
};

// Interpolation for smooth visual updates
export const interpolateProgress = (
  currentProgress: number,
  targetProgress: number,
  deltaTime: number,
  speed: number = 0.1
): number => {
  const difference = targetProgress - currentProgress;
  const step = difference * speed * (deltaTime / 16); // 60 FPS reference

  return currentProgress + step;
};