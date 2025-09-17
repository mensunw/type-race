'use client';

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Import existing single-player components
import TypingArea from '@/app/components/TypingArea';
import Stats from '@/app/components/Stats';
import EndGameModal from '@/app/components/EndGameModal';

// Import new multiplayer components
import MultiplayerLobby, { RoomCreation } from '@/app/components/MultiplayerLobby';
import MultiplayerTrack, { MultiplayerLeaderboard } from '@/app/components/MultiplayerTrack';
import MultiplayerCountdown from '@/app/components/MultiplayerCountdown';

// Import multiplayer hook
import { useMultiplayer } from '@/hooks/useMultiplayer';

type GamePhase = 'room_selection' | 'lobby' | 'countdown' | 'racing' | 'finished';

function MultiplayerPageContent() {
  const searchParams = useSearchParams();
  const [gamePhase, setGamePhase] = useState<GamePhase>('room_selection');
  const [roomId, setRoomId] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Refs for typing functionality
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Initialize room from URL params
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam) {
      setRoomId(roomParam);
      setGamePhase('lobby');
    }
  }, [searchParams]);

  // Multiplayer state and actions
  const [multiplayerState, multiplayerActions] = useMultiplayer({
    roomId,
    autoConnect: false
  });

  // Connect to room when roomId is set and we're in lobby phase
  useEffect(() => {
    // Only connect if we have a roomId, we're in lobby phase, and not already connected
    if (roomId && gamePhase === 'lobby' && !multiplayerState.isConnected) {
      setConnectionError(null);

      // Create an async function to handle the connection
      const connectToRoom = async () => {
        if (isConnecting) return;

        setIsConnecting(true);
        try {
          await multiplayerActions.connect(roomId);
          setIsConnecting(false);
        } catch (error: unknown) {
          setIsConnecting(false);
          setConnectionError(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setGamePhase('room_selection');
        }
      };

      // Small delay to ensure all state updates are processed
      const connectTimer = setTimeout(connectToRoom, 50);

      return () => clearTimeout(connectTimer);
    }
  }, [roomId, gamePhase, multiplayerState.isConnected, multiplayerActions]);

  // Handle game state changes
  useEffect(() => {
    switch (multiplayerState.gameState) {
      case 'waiting':
        if (multiplayerState.isConnected) {
          setGamePhase('lobby');
        }
        break;
      case 'countdown':
        setGamePhase('countdown');
        break;
      case 'active':
        setGamePhase('racing');
        // Focus the hidden input when racing starts
        setTimeout(() => hiddenInputRef.current?.focus(), 100);
        break;
      case 'finished':
        setGamePhase('finished');
        break;
    }
  }, [multiplayerState.gameState, multiplayerState.isConnected]);

  // Room management handlers
  const handleCreateRoom = useCallback(async (newRoomId: string) => {
    setConnectionError(null);
    setRoomId(newRoomId);
    setGamePhase('lobby');

    // Update URL
    window.history.pushState({}, '', `/multiplayer?room=${newRoomId}`);
  }, []);

  const handleJoinRoom = useCallback(async (targetRoomId: string) => {
    setConnectionError(null);
    setRoomId(targetRoomId);
    setGamePhase('lobby');

    // Update URL
    window.history.pushState({}, '', `/multiplayer?room=${targetRoomId}`);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    multiplayerActions.disconnect();
    setRoomId('');
    setGamePhase('room_selection');
    setConnectionError(null);

    // Clear URL
    window.history.pushState({}, '', '/multiplayer');
  }, [multiplayerActions]);

  const textWords = multiplayerState.textContent.split(' ').filter(word => word.length > 0);

  // Local typing state (like single player)
  const [localCurrentWordIndex, setLocalCurrentWordIndex] = useState(0);
  const [localCurrentWordInput, setLocalCurrentWordInput] = useState('');
  const [localCompletedWords, setLocalCompletedWords] = useState<string[]>([]);
  const [localCorrectChars, setLocalCorrectChars] = useState(0);
  const [localTotalTypedChars, setLocalTotalTypedChars] = useState(0);

  // Sync local state with multiplayer state when game starts/resets
  useEffect(() => {
    if (multiplayerState.gameState === 'active' || multiplayerState.gameState === 'countdown') {
      setLocalCurrentWordIndex(multiplayerState.currentWordIndex);
      setLocalCurrentWordInput(multiplayerState.currentWordInput);
      setLocalCompletedWords(multiplayerState.completedWords);
      setLocalCorrectChars(0);
      setLocalTotalTypedChars(0);
    }
  }, [multiplayerState.gameState, multiplayerState.currentWordIndex, multiplayerState.currentWordInput, multiplayerState.completedWords]);

  // Calculate local progress and stats (like single player)
  const calculateLocalStats = useCallback(() => {
    let totalCorrect = 0;
    let totalTyped = 0;

    // Count correct chars from completed words
    for (let i = 0; i < localCompletedWords.length; i++) {
      const expectedWord = textWords[i] || '';
      const typedWord = localCompletedWords[i];
      totalTyped += typedWord.length + 1; // +1 for space

      // Count correct characters in this word
      const correctInWord = Math.min(typedWord.length, expectedWord.length);
      for (let j = 0; j < correctInWord; j++) {
        if (typedWord[j] === expectedWord[j]) {
          totalCorrect++;
        }
      }

      // Add space if word was correct
      if (typedWord === expectedWord) {
        totalCorrect++;
      }
    }

    // Count correct chars in current word being typed
    if (localCurrentWordIndex < textWords.length) {
      const expectedWord = textWords[localCurrentWordIndex];
      totalTyped += localCurrentWordInput.length;

      const correctInCurrentWord = Math.min(localCurrentWordInput.length, expectedWord.length);
      for (let j = 0; j < correctInCurrentWord; j++) {
        if (localCurrentWordInput[j] === expectedWord[j]) {
          totalCorrect++;
        }
      }
    }

    setLocalCorrectChars(totalCorrect);
    setLocalTotalTypedChars(totalTyped);
  }, [localCompletedWords, localCurrentWordIndex, localCurrentWordInput, textWords]);

  // Update stats when local typing state changes
  useEffect(() => {
    if (multiplayerState.gameState === 'active') {
      calculateLocalStats();
    }
  }, [multiplayerState.gameState, calculateLocalStats]);

  // Periodic sync as backup (every 3 seconds during active game)
  useEffect(() => {
    if (multiplayerState.gameState !== 'active') return;

    const syncInterval = setInterval(() => {
      // Send current local progress to keep multiplayer in sync
      multiplayerActions.handleTyping(localCurrentWordInput, localCurrentWordIndex);
    }, 3000); // Sync every 3 seconds instead of every keystroke

    return () => clearInterval(syncInterval);
  }, [multiplayerState.gameState, localCurrentWordInput, localCurrentWordIndex, multiplayerActions]);

  // Typing handlers (like single player)
  const handleInputChange = useCallback((value: string) => {
    if (multiplayerState.gameState !== 'active') return;

    // Extract just the current word being typed (remove any spaces)
    const currentInput = value.replace(/\s/g, '');

    // Update local state immediately (no network delay)
    setLocalCurrentWordInput(currentInput);
  }, [multiplayerState.gameState]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (multiplayerState.gameState === 'active' && e.key === ' ') {
      e.preventDefault();

      // Complete current word and move to next (like single player)
      if (localCurrentWordIndex < textWords.length) {
        const newCompletedWords = [...localCompletedWords, localCurrentWordInput];
        const newWordIndex = localCurrentWordIndex + 1;

        // Update local state immediately
        setLocalCompletedWords(newCompletedWords);
        setLocalCurrentWordInput('');
        setLocalCurrentWordIndex(newWordIndex);

        // Send word completion to server (only on spacebar)
        multiplayerActions.handleTyping(localCurrentWordInput, newWordIndex);
      }
    }
  }, [multiplayerState.gameState, localCurrentWordIndex, localCurrentWordInput, localCompletedWords, textWords.length, multiplayerActions]);

  // Calculate local WPM and accuracy (like single player)
  const localWpm = useMemo(() => {
    if (!multiplayerState.startTime || multiplayerState.gameState !== 'active') return 0;
    const elapsedMinutes = (Date.now() - multiplayerState.startTime) / 60000;
    const words = localCorrectChars / 5; // 5 characters = 1 word
    return elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
  }, [localCorrectChars, multiplayerState.startTime, multiplayerState.gameState]);

  const localAccuracy = useMemo(() => {
    return localTotalTypedChars > 0 ? Math.round((localCorrectChars / localTotalTypedChars) * 100) : 100;
  }, [localCorrectChars, localTotalTypedChars]);

  const handleGameRestart = useCallback(() => {
    multiplayerActions.resetGame();
    setGamePhase('lobby');
    // Reset local state
    setLocalCurrentWordIndex(0);
    setLocalCurrentWordInput('');
    setLocalCompletedWords([]);
    setLocalCorrectChars(0);
    setLocalTotalTypedChars(0);
  }, [multiplayerActions]);

  // Render different phases
  const renderContent = () => {
    switch (gamePhase) {
      case 'room_selection':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                  🏎️ TypeRace Multiplayer
                </h1>
                <p className="text-gray-300">
                  Race against friends in real-time typing challenges
                </p>
              </div>

              <RoomCreation
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                isLoading={isConnecting}
              />

              {connectionError && (
                <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 max-w-md mx-auto">
                  <p className="text-red-200 text-sm text-center">{connectionError}</p>
                </div>
              )}

              <div className="text-center mt-8">
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        );

      case 'lobby':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Multiplayer Lobby
                </h1>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <MultiplayerLobby
                    players={multiplayerActions.getPlayerList()}
                    currentPlayer={multiplayerState.currentPlayer}
                    roomId={roomId}
                    isConnected={multiplayerState.isConnected}
                    gameState={multiplayerState.gameState}
                    onSetReady={multiplayerActions.setReady}
                  />
                </div>

                <div className="space-y-4">
                  <MultiplayerLeaderboard
                    players={multiplayerActions.getPlayerList()}
                    targetCharCount={multiplayerState.targetCharCount}
                  />

                  <button
                    onClick={handleLeaveRoom}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Leave Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Get Ready to Race!
                </h1>
              </div>

              <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3 space-y-6">
                  <MultiplayerTrack
                    players={multiplayerActions.getPlayerList()}
                    targetCharCount={multiplayerState.targetCharCount}
                    currentPlayerId={multiplayerState.currentPlayer?.id}
                  />

                  <MultiplayerCountdown
                    countdownPhase={multiplayerState.countdownPhase}
                    countdownTimeRemaining={multiplayerState.countdownTimeRemaining}
                  />
                </div>

                <div className="space-y-4">
                  <MultiplayerLeaderboard
                    players={multiplayerActions.getPlayerList()}
                    targetCharCount={multiplayerState.targetCharCount}
                  />

                  <Stats
                    wpm={localWpm}
                    accuracy={localAccuracy}
                    timeElapsed={Math.floor(multiplayerState.elapsedTime / 1000)}
                    isGameActive={multiplayerState.gameState === 'active'}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'racing':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white">
                  Race in Progress • Room: {roomId}
                </h1>
              </div>

              <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3 space-y-6">
                  <MultiplayerTrack
                    players={multiplayerActions.getPlayerList()}
                    targetCharCount={multiplayerState.targetCharCount}
                    currentPlayerId={multiplayerState.currentPlayer?.id}
                  />

                  <TypingArea
                    words={textWords}
                    currentWordIndex={localCurrentWordIndex}
                    currentWordInput={localCurrentWordInput}
                    completedWords={localCompletedWords}
                    isGameActive={multiplayerState.gameState === 'active'}
                    isCountdownActive={false}
                    skippedWords={new Set<number>()}
                    onInputChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onCountdownComplete={() => {}}
                  />
                </div>

                <div className="space-y-4">
                  <Stats
                    wpm={localWpm}
                    accuracy={localAccuracy}
                    timeElapsed={Math.floor(multiplayerState.elapsedTime / 1000)}
                    isGameActive={multiplayerState.gameState === 'active'}
                  />

                  <MultiplayerLeaderboard
                    players={multiplayerActions.getPlayerList()}
                    targetCharCount={multiplayerState.targetCharCount}
                  />

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white mb-1">
                        Your Progress
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        {Math.round((localCorrectChars / multiplayerState.targetCharCount) * 100)}%
                      </div>
                      <div className="text-sm text-gray-300">
                        {localCorrectChars} / {multiplayerState.targetCharCount} chars
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden input for capturing keystrokes */}
            <input
              ref={hiddenInputRef}
              type="text"
              className="absolute opacity-0 pointer-events-none"
              autoFocus
              aria-hidden="true"
            />
          </div>
        );

      case 'finished':
        const winner = multiplayerActions.getPlayerList().find(p => p.isFinished);
        const currentPlayerStats = multiplayerState.currentPlayer;

        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl">
              <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3 space-y-6">
                  <MultiplayerTrack
                    players={multiplayerActions.getPlayerList()}
                    targetCharCount={multiplayerState.targetCharCount}
                    currentPlayerId={multiplayerState.currentPlayer?.id}
                  />

                  <MultiplayerLeaderboard
                    players={multiplayerActions.getPlayerList()}
                    targetCharCount={multiplayerState.targetCharCount}
                  />
                </div>

                <div className="space-y-4">
                  <Stats
                    wpm={localWpm}
                    accuracy={localAccuracy}
                    timeElapsed={Math.floor(multiplayerState.elapsedTime / 1000)}
                    isGameActive={multiplayerState.gameState === 'active'}
                  />

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleGameRestart}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Return to Lobby
                    </button>

                    <button
                      onClick={handleLeaveRoom}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Leave Room
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* End Game Modal */}
            {currentPlayerStats && (
              <EndGameModal
                isOpen={true}
                winner={winner?.id === currentPlayerStats.id ? 'player' : null}
                wpm={currentPlayerStats.wpm}
                accuracy={currentPlayerStats.accuracy}
                timeElapsed={Math.floor(multiplayerState.elapsedTime / 1000)}
                onRestart={handleGameRestart}
                onHome={handleLeaveRoom}
              />
            )}
          </div>
        );

      default:
        return <div>Unknown game phase</div>;
    }
  };

  return renderContent();
}

// Main component with Suspense wrapper
export default function MultiplayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading multiplayer...</div>
      </div>
    }>
      <MultiplayerPageContent />
    </Suspense>
  );
}