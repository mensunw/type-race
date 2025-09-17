'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Import existing single-player components
import TypingArea from '@/app/components/TypingArea';
import Stats from '@/app/components/Stats';
import Countdown from '@/app/components/Countdown';
import EndGameModal from '@/app/components/EndGameModal';

// Import new multiplayer components
import MultiplayerLobby, { RoomCreation } from '@/app/components/MultiplayerLobby';
import MultiplayerTrack, { MultiplayerLeaderboard } from '@/app/components/MultiplayerTrack';

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
    if (roomId && gamePhase === 'lobby' && !multiplayerState.isConnected && !isConnecting) {
      setIsConnecting(true);
      setConnectionError(null);

      multiplayerActions.connect()
        .then(() => {
          setIsConnecting(false);
        })
        .catch((error) => {
          setIsConnecting(false);
          setConnectionError(`Failed to connect: ${error.message}`);
          setGamePhase('room_selection');
        });
    }
  }, [roomId, gamePhase, multiplayerState.isConnected, isConnecting, multiplayerActions]);

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
    setIsConnecting(true);
    setConnectionError(null);
    setRoomId(newRoomId);
    setGamePhase('lobby');

    // Update URL
    window.history.pushState({}, '', `/multiplayer?room=${newRoomId}`);
  }, []);

  const handleJoinRoom = useCallback(async (targetRoomId: string) => {
    setIsConnecting(true);
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

  // Typing handlers
  const handleTyping = useCallback((input: string, wordIndex: number) => {
    if (multiplayerState.gameState === 'active') {
      multiplayerActions.handleTyping(input, wordIndex);
    }
  }, [multiplayerState.gameState, multiplayerActions]);

  const handleGameRestart = useCallback(() => {
    multiplayerActions.resetGame();
    setGamePhase('lobby');
  }, [multiplayerActions]);

  const textWords = multiplayerState.textContent.split(' ').filter(word => word.length > 0);

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

                  <Countdown
                    onComplete={() => {}} // Handled by server
                  />
                </div>

                <div className="space-y-4">
                  <MultiplayerLeaderboard
                    players={multiplayerActions.getPlayerList()}
                    targetCharCount={multiplayerState.targetCharCount}
                  />

                  <Stats
                    wpm={multiplayerState.wpm}
                    accuracy={multiplayerState.accuracy}
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
                    currentWordIndex={multiplayerState.currentWordIndex}
                    currentWordInput={multiplayerState.currentWordInput}
                    completedWords={multiplayerState.completedWords}
                    isGameActive={multiplayerState.gameState === 'active'}
                    isCountdownActive={false}
                    skippedWords={new Set<number>()}
                    onInputChange={(value: string) => handleTyping(value, multiplayerState.currentWordIndex)}
                    onKeyPress={() => {}}
                    onCountdownComplete={() => {}}
                  />
                </div>

                <div className="space-y-4">
                  <Stats
                    wpm={multiplayerState.wpm}
                    accuracy={multiplayerState.accuracy}
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
                        {Math.round((multiplayerState.correctChars / multiplayerState.targetCharCount) * 100)}%
                      </div>
                      <div className="text-sm text-gray-300">
                        {multiplayerState.correctChars} / {multiplayerState.targetCharCount} chars
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
                    wpm={multiplayerState.wpm}
                    accuracy={multiplayerState.accuracy}
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