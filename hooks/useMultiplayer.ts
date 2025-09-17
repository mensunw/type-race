'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SerializedPlayer,
  MultiplayerGameState,
  ConnectionState,
  generatePlayerId
} from '@/types/multiplayer';
import { WebSocketService, createWebSocketService } from '@/lib/websocket';
import { GameSynchronizer, createGameSynchronizer, calculateWPM, calculateAccuracy } from '@/lib/game-sync';

export interface UseMultiplayerOptions {
  roomId: string;
  playerName?: string;
  autoConnect?: boolean;
}

export interface MultiplayerState {
  // Connection state
  connectionState: ConnectionState;
  isConnected: boolean;

  // Room state
  players: Map<string, SerializedPlayer>;
  currentPlayer: SerializedPlayer | null;
  gameState: MultiplayerGameState;

  // Game data
  textContent: string;
  targetCharCount: number;

  // Typing state (client prediction)
  currentWordIndex: number;
  currentWordInput: string;
  completedWords: string[];
  correctChars: number;
  wpm: number;
  accuracy: number;

  // Game timing
  startTime: number | null;
  elapsedTime: number;

  // Countdown
  countdownPhase: number | null;
  countdownTimeRemaining: number;
}

export interface MultiplayerActions {
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;

  // Game actions
  setReady: (isReady: boolean) => void;
  handleTyping: (input: string, wordIndex: number) => void;
  resetGame: () => void;

  // Utility
  getPlayerProgress: (playerId: string) => number;
  getPlayerList: () => SerializedPlayer[];
  isGameWaiting: () => boolean;
  isGameActive: () => boolean;
  isGameFinished: () => boolean;
}

export const useMultiplayer = ({
  roomId,
  playerName: _playerName = 'Anonymous',
  autoConnect = true
}: UseMultiplayerOptions): [MultiplayerState, MultiplayerActions] => {

  // Core refs
  const wsRef = useRef<WebSocketService | null>(null);
  const syncRef = useRef<GameSynchronizer | null>(null);
  const playerIdRef = useRef<string>(generatePlayerId());
  const textWordsRef = useRef<string[]>([]);

  // State
  const [state, setState] = useState<MultiplayerState>({
    connectionState: {
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      lastHeartbeat: Date.now(),
      roundTripTime: 0
    },
    isConnected: false,
    players: new Map(),
    currentPlayer: null,
    gameState: 'waiting',
    textContent: '',
    targetCharCount: 200,
    currentWordIndex: 0,
    currentWordInput: '',
    completedWords: [],
    correctChars: 0,
    wpm: 0,
    accuracy: 100,
    startTime: null,
    elapsedTime: 0,
    countdownPhase: null,
    countdownTimeRemaining: 0
  });

  // Timer for elapsed time updates
  useEffect(() => {
    if (!state.startTime || state.gameState !== 'active') return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        elapsedTime: Date.now() - (prev.startTime || Date.now())
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [state.startTime, state.gameState]);

  // Initialize WebSocket service and synchronizer
  const initializeServices = useCallback(() => {
    if (!wsRef.current) {
      wsRef.current = createWebSocketService();
      syncRef.current = createGameSynchronizer(playerIdRef.current);

      // Set up WebSocket event handlers
      wsRef.current.on({
        onPlayerJoin: (player) => {
          setState(prev => {
            const newPlayers = new Map(prev.players);
            newPlayers.set(player.id, player);
            return { ...prev, players: newPlayers };
          });
        },

        onPlayerLeave: (playerId) => {
          setState(prev => {
            const newPlayers = new Map(prev.players);
            newPlayers.delete(playerId);
            return { ...prev, players: newPlayers };
          });
        },

        onPlayerReady: (playerId, isReady) => {
          setState(prev => {
            const newPlayers = new Map(prev.players);
            const player = newPlayers.get(playerId);
            if (player) {
              newPlayers.set(playerId, { ...player, isReady });
            }
            return { ...prev, players: newPlayers };
          });
        },

        onGameStart: (textContent, targetCharCount) => {
          textWordsRef.current = textContent.split(' ');
          setState(prev => ({
            ...prev,
            textContent,
            targetCharCount,
            gameState: 'active',
            startTime: Date.now(),
            countdownPhase: null
          }));
        },

        onCountdownSync: (phase, serverTime) => {
          const sync = syncRef.current?.syncCountdown(phase, serverTime);
          if (sync) {
            setState(prev => ({
              ...prev,
              gameState: 'countdown',
              countdownPhase: sync.phase,
              countdownTimeRemaining: sync.timeRemaining
            }));
          }
        },

        onTypingProgress: (playerId, progress) => {
          setState(prev => {
            const newPlayers = new Map(prev.players);
            const player = newPlayers.get(playerId);
            if (player) {
              newPlayers.set(playerId, {
                ...player,
                correctChars: progress.correctChars,
                currentWordIndex: progress.currentWordIndex,
                wpm: progress.wpm,
                accuracy: progress.accuracy
              });
            }
            return { ...prev, players: newPlayers };
          });
        },

        onPlayerFinished: (playerId, finalStats) => {
          setState(prev => {
            const newPlayers = new Map(prev.players);
            const player = newPlayers.get(playerId);
            if (player) {
              newPlayers.set(playerId, {
                ...player,
                isFinished: true,
                finishTime: finalStats.finishTime
              });
            }
            return { ...prev, players: newPlayers };
          });
        },

        onGameStateSync: (gameState, players) => {
          const playersMap = new Map(players.map(p => [p.id, p]));
          const currentPlayer = playersMap.get(playerIdRef.current) || null;

          setState(prev => ({
            ...prev,
            gameState,
            players: playersMap,
            currentPlayer
          }));
        },

        onConnectionChange: (isConnected) => {
          setState(prev => ({
            ...prev,
            isConnected,
            connectionState: {
              ...prev.connectionState,
              isConnected
            }
          }));
        },

        onError: (message, code) => {
          console.error('Multiplayer error:', message, code);
        }
      });
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!wsRef.current) {
      initializeServices();
    }

    if (wsRef.current) {
      try {
        await wsRef.current.connect(roomId, playerIdRef.current);
      } catch (error) {
        console.error('Failed to connect to multiplayer:', error);
        throw error;
      }
    }
  }, [roomId, initializeServices]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
  }, []);

  // Set player ready state
  const setReady = useCallback((isReady: boolean) => {
    if (!wsRef.current || !state.isConnected) return;

    wsRef.current.sendMessage({
      type: 'player_ready',
      playerId: playerIdRef.current,
      isReady,
      timestamp: Date.now()
    });
  }, [state.isConnected]);

  // Handle typing input with client-side prediction
  const handleTyping = useCallback((input: string, wordIndex: number) => {
    if (!syncRef.current || !wsRef.current || state.gameState !== 'active') return;

    // Client-side prediction for immediate feedback
    const predictedState = syncRef.current.predictiveUpdate(
      input,
      wordIndex,
      textWordsRef.current
    );

    // Calculate WPM and accuracy
    const elapsedSeconds = (Date.now() - (state.startTime || Date.now())) / 1000;
    const wpm = calculateWPM(predictedState.correctChars, elapsedSeconds * 1000);
    const accuracy = calculateAccuracy(
      predictedState.correctChars,
      predictedState.correctChars + Math.max(0, input.length - predictedState.correctChars)
    );

    // Update local state immediately
    setState(prev => ({
      ...prev,
      currentWordIndex: predictedState.currentWordIndex,
      currentWordInput: predictedState.currentWordInput,
      completedWords: predictedState.completedWords,
      correctChars: predictedState.correctChars,
      wpm,
      accuracy
    }));

    // Send to server
    wsRef.current.sendMessage({
      type: 'typing_progress',
      playerId: playerIdRef.current,
      correctChars: predictedState.correctChars,
      currentWordIndex: predictedState.currentWordIndex,
      completedWords: predictedState.completedWords,
      currentWordInput: predictedState.currentWordInput,
      wpm,
      accuracy,
      timestamp: Date.now()
    });

  }, [state.gameState, state.startTime]);

  // Reset game state
  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentWordIndex: 0,
      currentWordInput: '',
      completedWords: [],
      correctChars: 0,
      wpm: 0,
      accuracy: 100,
      startTime: null,
      elapsedTime: 0,
      countdownPhase: null
    }));
  }, []);

  // Get player progress percentage
  const getPlayerProgress = useCallback((playerId: string): number => {
    const player = state.players.get(playerId);
    if (!player || state.targetCharCount === 0) return 0;
    return Math.min(100, (player.correctChars / state.targetCharCount) * 100);
  }, [state.players, state.targetCharCount]);

  // Get list of players
  const getPlayerList = useCallback((): SerializedPlayer[] => {
    return Array.from(state.players.values());
  }, [state.players]);

  // Game state helpers
  const isGameWaiting = useCallback(() => state.gameState === 'waiting', [state.gameState]);
  const isGameActive = useCallback(() => state.gameState === 'active', [state.gameState]);
  const isGameFinished = useCallback(() => state.gameState === 'finished', [state.gameState]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect().catch(console.error);
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  const actions: MultiplayerActions = {
    connect,
    disconnect,
    setReady,
    handleTyping,
    resetGame,
    getPlayerProgress,
    getPlayerList,
    isGameWaiting,
    isGameActive,
    isGameFinished
  };

  return [state, actions];
};