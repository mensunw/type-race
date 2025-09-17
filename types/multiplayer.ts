// Core multiplayer types for TypeRace real-time multiplayer

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isConnected: boolean;
  correctChars: number;
  currentWordIndex: number;
  completedWords: string[];
  currentWordInput: string;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  finishTime?: number;
}

export interface Room {
  id: string;
  players: Map<string, Player>;
  gameState: MultiplayerGameState;
  settings: GameSettings;
  textContent: string;
  targetCharCount: number;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface GameSettings {
  targetCharCount: number;
  maxPlayers: number;
  isPrivate: boolean;
}

export type MultiplayerGameState = 'waiting' | 'countdown' | 'active' | 'finished' | 'paused';

export type GameMessage =
  | {
      type: 'player_join';
      playerId: string;
      playerName: string;
      timestamp: number;
    }
  | {
      type: 'player_leave';
      playerId: string;
      timestamp: number;
    }
  | {
      type: 'player_ready';
      playerId: string;
      isReady: boolean;
      timestamp: number;
    }
  | {
      type: 'game_start';
      textContent: string;
      targetCharCount: number;
      timestamp: number;
    }
  | {
      type: 'countdown_sync';
      phase: number; // 3, 2, 1, 0 (go)
      serverTime: number;
    }
  | {
      type: 'typing_progress';
      playerId: string;
      correctChars: number;
      currentWordIndex: number;
      completedWords: string[];
      currentWordInput: string;
      wpm: number;
      accuracy: number;
      timestamp: number;
    }
  | {
      type: 'player_finished';
      playerId: string;
      finalStats: {
        correctChars: number;
        wpm: number;
        accuracy: number;
        finishTime: number;
      };
      timestamp: number;
    }
  | {
      type: 'game_state_sync';
      gameState: MultiplayerGameState;
      players: SerializedPlayer[];
      timestamp: number;
    }
  | {
      type: 'heartbeat';
      timestamp: number;
    }
  | {
      type: 'error';
      message: string;
      code: ErrorCode;
      timestamp: number;
    };

// Serialized version of Player for network transmission
export interface SerializedPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isConnected: boolean;
  correctChars: number;
  currentWordIndex: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  finishTime?: number;
}

export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'INVALID_MESSAGE'
  | 'PLAYER_NOT_FOUND'
  | 'GAME_ALREADY_STARTED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR';

export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastHeartbeat: number;
  roundTripTime: number;
}

export interface MultiplayerGameStats {
  playerId: string;
  playerName: string;
  wpm: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
  finishTime?: number;
  placement?: number;
}

// Client-side prediction state
export interface PredictedState {
  correctChars: number;
  currentWordIndex: number;
  currentWordInput: string;
  completedWords: string[];
  timestamp: number;
  confirmed: boolean;
}

// WebSocket connection configuration
export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageTimeout: number;
}

// Event handlers for WebSocket events
export interface WebSocketEventHandlers {
  onPlayerJoin?: (player: SerializedPlayer) => void;
  onPlayerLeave?: (playerId: string) => void;
  onPlayerReady?: (playerId: string, isReady: boolean) => void;
  onGameStart?: (textContent: string, targetCharCount: number) => void;
  onCountdownSync?: (phase: number, serverTime: number) => void;
  onTypingProgress?: (playerId: string, progress: SerializedPlayer) => void;
  onPlayerFinished?: (playerId: string, finalStats: MultiplayerGameStats) => void;
  onGameStateSync?: (gameState: MultiplayerGameState, players: SerializedPlayer[]) => void;
  onError?: (message: string, code: ErrorCode) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

// Type guards for message validation
export const isGameMessage = (data: unknown): data is GameMessage => {
  if (!data || typeof data !== 'object') return false;

  const message = data as Record<string, unknown>;

  if (typeof message.type !== 'string' || typeof message.timestamp !== 'number') {
    return false;
  }

  switch (message.type) {
    case 'player_join':
      return typeof message.playerId === 'string' && typeof message.playerName === 'string';
    case 'player_leave':
      return typeof message.playerId === 'string';
    case 'player_ready':
      return typeof message.playerId === 'string' && typeof message.isReady === 'boolean';
    case 'game_start':
      return typeof message.textContent === 'string' && typeof message.targetCharCount === 'number';
    case 'countdown_sync':
      return typeof message.phase === 'number' && typeof message.serverTime === 'number';
    case 'typing_progress':
      return (
        typeof message.playerId === 'string' &&
        typeof message.correctChars === 'number' &&
        typeof message.currentWordIndex === 'number' &&
        Array.isArray(message.completedWords) &&
        typeof message.currentWordInput === 'string' &&
        typeof message.wpm === 'number' &&
        typeof message.accuracy === 'number'
      );
    case 'player_finished':
      return (
        typeof message.playerId === 'string' &&
        typeof message.finalStats === 'object' &&
        message.finalStats !== null
      );
    case 'game_state_sync':
      return (
        typeof message.gameState === 'string' &&
        Array.isArray(message.players)
      );
    case 'heartbeat':
    case 'error':
      return true;
    default:
      return false;
  }
};

// Utility functions for working with multiplayer data
export const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  isReady: false,
  isConnected: true,
  correctChars: 0,
  currentWordIndex: 0,
  completedWords: [],
  currentWordInput: '',
  wpm: 0,
  accuracy: 100,
  isFinished: false
});

export const serializePlayer = (player: Player): SerializedPlayer => ({
  id: player.id,
  name: player.name,
  isReady: player.isReady,
  isConnected: player.isConnected,
  correctChars: player.correctChars,
  currentWordIndex: player.currentWordIndex,
  wpm: player.wpm,
  accuracy: player.accuracy,
  isFinished: player.isFinished,
  finishTime: player.finishTime
});

export const generateRoomId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};