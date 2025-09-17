'use client';

import { useState, useCallback, useRef } from 'react';
import { SerializedPlayer } from '@/types/multiplayer';
import { generateRoomId } from '@/types/multiplayer';

interface MultiplayerLobbyProps {
  players: SerializedPlayer[];
  currentPlayer: SerializedPlayer | null;
  roomId: string;
  isConnected: boolean;
  gameState: string;
  onSetReady: (isReady: boolean) => void;
  onStartGame?: () => void;
}

export default function MultiplayerLobby({
  players,
  currentPlayer,
  roomId,
  isConnected,
  gameState,
  onSetReady
}: MultiplayerLobbyProps) {
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const roomCodeRef = useRef<HTMLInputElement>(null);

  const handleCopyRoomCode = useCallback(async () => {
    try {
      const roomUrl = `${window.location.origin}/multiplayer?room=${roomId}`;
      await navigator.clipboard.writeText(roomUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback for older browsers
      if (roomCodeRef.current) {
        roomCodeRef.current.select();
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  }, [roomId]);

  const handleReadyToggle = useCallback(() => {
    if (currentPlayer) {
      onSetReady(!currentPlayer.isReady);
    }
  }, [currentPlayer, onSetReady]);

  const getPlayerStatusColor = useCallback((player: SerializedPlayer) => {
    if (!player.isConnected) return 'text-red-500';
    if (player.isReady) return 'text-green-500';
    return 'text-yellow-500';
  }, []);

  const getPlayerStatusText = useCallback((player: SerializedPlayer) => {
    if (!player.isConnected) return 'Disconnected';
    if (player.isReady) return 'Ready';
    return 'Not Ready';
  }, []);

  const allPlayersReady = players.length >= 2 && players.every(p => p.isReady && p.isConnected);
  const canStartGame = allPlayersReady && gameState === 'waiting';

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      {/* Room Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Multiplayer Lobby
          </h2>
          <p className="text-gray-300 text-sm">
            Room: <span className="font-mono font-medium">{roomId}</span>
          </p>
        </div>

        <button
          onClick={() => setShowRoomCode(!showRoomCode)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Share Room
        </button>
      </div>

      {/* Room Sharing */}
      {showRoomCode && (
        <div className="bg-black/20 rounded-lg p-4 mb-6">
          <p className="text-gray-300 text-sm mb-2">
            Share this link with friends:
          </p>
          <div className="flex items-center gap-2">
            <input
              ref={roomCodeRef}
              type="text"
              value={`${window.location.origin}/multiplayer?room=${roomId}`}
              readOnly
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded text-sm font-mono"
            />
            <button
              onClick={handleCopyRoomCode}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                copySuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-200 text-sm font-medium">
              Connecting to server...
            </span>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">
          Players ({players.length}/4)
        </h3>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                player.id === currentPlayer?.id
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    player.isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <div>
                  <span className="text-white font-medium">
                    {player.name}
                    {player.id === currentPlayer?.id && (
                      <span className="text-blue-400 text-sm ml-2">(You)</span>
                    )}
                  </span>
                  <p className={`text-xs ${getPlayerStatusColor(player)}`}>
                    {getPlayerStatusText(player)}
                  </p>
                </div>
              </div>

              {player.isReady && (
                <div className="text-green-400 text-sm font-medium flex items-center gap-1">
                  <span>✓</span>
                  Ready
                </div>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 4 - players.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex items-center p-3 rounded-lg bg-gray-800/30 border-2 border-dashed border-gray-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                <span className="text-gray-500 font-medium">
                  Waiting for player...
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Status */}
      {gameState === 'countdown' && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-200 text-sm font-medium">
              Game starting soon...
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {players.length < 2 ? (
            'Waiting for more players to join...'
          ) : canStartGame ? (
            'All players ready! Game will start automatically.'
          ) : (
            `Waiting for ${players.filter(p => !p.isReady).length} player(s) to ready up...`
          )}
        </div>

        {/* Ready Button */}
        {currentPlayer && isConnected && gameState === 'waiting' && (
          <button
            onClick={handleReadyToggle}
            disabled={!isConnected}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
              currentPlayer.isReady
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {currentPlayer.isReady ? 'Not Ready' : 'Ready Up'}
          </button>
        )}
      </div>

      {/* Game Info */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Game Mode: Race</span>
          <span>Target: 200 characters</span>
        </div>
      </div>
    </div>
  );
}

// Room Creation Component
interface RoomCreationProps {
  onCreateRoom: (roomId: string) => void;
  onJoinRoom: (roomId: string) => void;
  isLoading?: boolean;
}

export function RoomCreation({ onCreateRoom, onJoinRoom, isLoading = false }: RoomCreationProps) {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = useCallback(() => {
    const newRoomId = generateRoomId();
    setError(null);
    onCreateRoom(newRoomId);
  }, [onCreateRoom]);

  const handleJoinRoom = useCallback(() => {
    if (!joinRoomId.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (joinRoomId.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setError(null);
    onJoinRoom(joinRoomId.toUpperCase());
  }, [joinRoomId, onJoinRoom]);

  return (
    <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <h2 className="text-3xl font-bold text-white text-center mb-8">
        Join Multiplayer Game
      </h2>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Create Room */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">Create New Room</h3>
        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isLoading ? 'Creating...' : 'Create Room'}
        </button>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gradient-to-br from-blue-900 to-indigo-900 text-gray-300">or</span>
        </div>
      </div>

      {/* Join Room */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Join Existing Room</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={joinRoomId}
            onChange={(e) => {
              setJoinRoomId(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Enter room code"
            maxLength={6}
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg font-mono text-center tracking-wider placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={handleJoinRoom}
            disabled={isLoading || !joinRoomId.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {isLoading ? 'Joining...' : 'Join'}
          </button>
        </div>
        <p className="text-gray-400 text-xs text-center">
          Room codes are 6 characters (e.g., ABC123)
        </p>
      </div>
    </div>
  );
}