'use client';

import { useMemo, useRef } from 'react';
import { SerializedPlayer } from '@/types/multiplayer';

interface MultiplayerTrackProps {
  players: SerializedPlayer[];
  targetCharCount: number;
  currentPlayerId?: string;
  showFinishLine?: boolean;
}

interface PlayerPosition {
  player: SerializedPlayer;
  progress: number;
  lane: number;
  isCurrentPlayer: boolean;
}

export default function MultiplayerTrack({
  players,
  targetCharCount,
  currentPlayerId,
  showFinishLine = true
}: MultiplayerTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Calculate player positions with lane assignment
  const playerPositions = useMemo((): PlayerPosition[] => {
    const positions = players.map((player) => ({
      player,
      progress: targetCharCount > 0 ? (player.correctChars / targetCharCount) * 100 : 0,
      lane: 0,
      isCurrentPlayer: player.id === currentPlayerId
    }));

    // Sort by progress for lane assignment (leader gets top lane)
    positions.sort((a, b) => b.progress - a.progress);

    // Assign lanes with collision avoidance
    const maxLanes = Math.min(4, players.length);

    positions.forEach((pos, index) => {
      // Distribute players evenly across available lanes
      pos.lane = (index * (100 / maxLanes)) + (100 / (maxLanes * 2)) - 10;
    });

    return positions;
  }, [players, targetCharCount, currentPlayerId]);

  // Get player color based on position
  const getPlayerColor = (position: PlayerPosition): string => {
    if (position.isCurrentPlayer) return 'text-blue-400 border-blue-400';
    if (position.player.isFinished) return 'text-green-400 border-green-400';
    if (!position.player.isConnected) return 'text-red-400 border-red-400';
    return 'text-purple-400 border-purple-400';
  };

  // Get player car emoji based on position
  const getPlayerCar = (position: PlayerPosition): string => {
    if (position.isCurrentPlayer) return '🏎️';
    if (position.player.isFinished) return '🏁';
    return '🚗';
  };

  return (
    <div
      ref={trackRef}
      className="relative w-full h-40 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl border-2 border-gray-600 overflow-hidden"
    >
      {/* Track surface with lane markings */}
      <div className="absolute inset-0">
        {/* Lane dividers */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="absolute w-full border-t border-dashed border-gray-500 opacity-30"
            style={{
              top: `${25 + index * 25}%`
            }}
          />
        ))}

        {/* Track edges */}
        <div className="absolute top-0 w-full h-1 bg-yellow-400"></div>
        <div className="absolute bottom-0 w-full h-1 bg-yellow-400"></div>
      </div>

      {/* Finish line */}
      {showFinishLine && (
        <div className="absolute right-0 top-0 w-2 h-full bg-gradient-to-b from-red-500 to-white bg-repeat-x opacity-80">
          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
            <span className="text-2xl">🏆</span>
          </div>
        </div>
      )}

      {/* Progress markers */}
      <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
        {[25, 50, 75].map((marker) => (
          <div
            key={marker}
            className="flex flex-col items-center opacity-40"
            style={{ left: `${marker}%` }}
          >
            <div className="w-px h-full bg-gray-400"></div>
            <span className="text-xs text-gray-400 mt-1">{marker}%</span>
          </div>
        ))}
      </div>

      {/* Player cars */}
      {playerPositions.map((position, index) => (
        <div
          key={position.player.id}
          className={`absolute transition-all duration-300 ease-out ${getPlayerColor(position)}`}
          style={{
            left: `${Math.min(Math.max(position.progress, 3), 92)}%`,
            top: `${position.lane}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: position.isCurrentPlayer ? 20 : 10 + index
          }}
        >
          {/* Player car */}
          <div className="relative flex items-center">
            <div className="text-2xl transform scale-x-[-1]">
              {getPlayerCar(position)}
            </div>

            {/* Player info tooltip */}
            <div className={`absolute left-full ml-2 px-2 py-1 rounded text-xs whitespace-nowrap border backdrop-blur-sm ${
              position.isCurrentPlayer
                ? 'bg-blue-900/80 border-blue-400'
                : 'bg-gray-900/80 border-gray-400'
            } ${position.isCurrentPlayer ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
              <div className="font-semibold">{position.player.name}</div>
              <div className="text-gray-300">
                {position.player.wpm} WPM • {position.player.accuracy}%
              </div>
              {position.player.isFinished && (
                <div className="text-green-400 text-xs">Finished!</div>
              )}
              {!position.player.isConnected && (
                <div className="text-red-400 text-xs">Disconnected</div>
              )}
            </div>

            {/* Progress indicator for current player */}
            {position.isCurrentPlayer && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  {Math.round(position.progress)}%
                </div>
              </div>
            )}

            {/* Finish effects */}
            {position.player.isFinished && (
              <div className="absolute -top-2 -left-2 pointer-events-none">
                <div className="text-yellow-400 animate-bounce text-sm">✨</div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Starting line */}
      <div className="absolute left-0 top-0 w-1 h-full bg-green-500 opacity-60">
        <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
          <span className="text-lg">🚦</span>
        </div>
      </div>

      {/* Race statistics overlay */}
      <div className="absolute top-2 left-2 text-xs text-gray-300 space-y-1">
        <div>Players: {players.length}</div>
        <div>Target: {targetCharCount} chars</div>
        {players.some(p => p.isFinished) && (
          <div className="text-green-400 font-semibold">
            Winner: {players.find(p => p.isFinished)?.name}
          </div>
        )}
      </div>

      {/* Connection status indicators */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        {players.map((player) => (
          <div
            key={player.id}
            className={`w-2 h-2 rounded-full ${
              !player.isConnected
                ? 'bg-red-500 animate-pulse'
                : player.isFinished
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            title={`${player.name} - ${
              !player.isConnected
                ? 'Disconnected'
                : player.isFinished
                ? 'Finished'
                : 'Racing'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Leaderboard component for multiplayer
interface MultiplayerLeaderboardProps {
  players: SerializedPlayer[];
  targetCharCount: number;
}

export function MultiplayerLeaderboard({ players, targetCharCount }: MultiplayerLeaderboardProps) {
  // Sort players by progress, then by WPM
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.isFinished !== b.isFinished) {
        return a.isFinished ? -1 : 1;
      }
      if (a.isFinished && b.isFinished) {
        return (a.finishTime || 0) - (b.finishTime || 0);
      }
      if (a.correctChars !== b.correctChars) {
        return b.correctChars - a.correctChars;
      }
      return b.wpm - a.wpm;
    });
  }, [players]);

  const getPositionColor = (index: number): string => {
    switch (index) {
      case 0: return 'text-yellow-400'; // Gold
      case 1: return 'text-gray-300';   // Silver
      case 2: return 'text-orange-400'; // Bronze
      default: return 'text-gray-400';
    }
  };

  const getPositionEmoji = (index: number): string => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <span>🏁</span>
        Live Leaderboard
      </h3>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-2 rounded-lg ${
              player.isFinished ? 'bg-green-900/30' : 'bg-gray-800/50'
            } ${!player.isConnected ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className={`font-bold text-sm ${getPositionColor(index)}`}>
                {typeof getPositionEmoji(index) === 'string' && getPositionEmoji(index).includes('#')
                  ? getPositionEmoji(index)
                  : <span className="text-lg">{getPositionEmoji(index)}</span>
                }
              </span>
              <div>
                <div className="text-white font-medium text-sm">
                  {player.name}
                  {!player.isConnected && (
                    <span className="text-red-400 text-xs ml-2">(Disconnected)</span>
                  )}
                </div>
                <div className="text-gray-400 text-xs">
                  {player.correctChars}/{targetCharCount} chars • {player.wpm} WPM
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${
                player.isFinished ? 'text-green-400' : 'text-gray-300'
              }`}>
                {Math.round((player.correctChars / targetCharCount) * 100)}%
              </div>
              <div className="text-xs text-gray-400">
                {player.accuracy}% acc
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}