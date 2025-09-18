interface EndGameModalProps {
  isOpen: boolean;
  winner: 'player' | 'bot' | null;
  wpm: number;
  accuracy: number;
  timeElapsed: number;
  onRestart: () => void;
  onHome: () => void;
  // Multiplayer-specific props
  mode?: 'single' | 'multiplayer';
  winnerName?: string;
  currentPlayerName?: string;
}

export default function EndGameModal({
  isOpen,
  winner,
  wpm,
  accuracy,
  timeElapsed,
  onRestart,
  onHome,
  mode = 'single',
  winnerName,
}: EndGameModalProps) {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper functions for multiplayer vs single player messaging
  const getEmoji = () => {
    if (mode === 'multiplayer') {
      return winner === 'player' ? '🏆' : '🏁';
    }
    return winner === 'player' ? '🏆' : '🤖';
  };

  const getTitle = () => {
    if (mode === 'multiplayer') {
      if (winner === 'player') {
        return 'You Win!';
      } else {
        return winnerName ? `${winnerName} Wins!` : 'Race Finished!';
      }
    }
    return winner === 'player' ? 'You Win!' : 'Bot Wins!';
  };

  const getMessage = () => {
    if (mode === 'multiplayer') {
      if (winner === 'player') {
        return 'Congratulations! You won the race!';
      } else {
        return winnerName ? `${winnerName} finished first. Better luck next time!` : 'Better luck next time!';
      }
    }
    return winner === 'player'
      ? 'Congratulations! You beat the bot!'
      : 'Better luck next time! Keep practicing.';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">
            {getEmoji()}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {getTitle()}
          </h2>
          <p className="text-gray-600">
            {getMessage()}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Final Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-bold text-blue-600">{Math.round(wpm)}</div>
              <div className="text-gray-500">WPM</div>
            </div>
            <div>
              <div className="font-bold text-green-600">{Math.round(accuracy)}%</div>
              <div className="text-gray-500">Accuracy</div>
            </div>
            <div>
              <div className="font-bold text-purple-600">{formatTime(timeElapsed)}</div>
              <div className="text-gray-500">Time</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            🔄 Race Again
          </button>
          <button
            onClick={onHome}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}