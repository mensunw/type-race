interface StatsProps {
  wpm: number;
  accuracy: number;
  timeElapsed: number;
  isGameActive: boolean;
}

export default function Stats({ wpm, accuracy, timeElapsed }: StatsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{Math.round(wpm)}</div>
        <div className="text-sm text-blue-500 font-medium">WPM</div>
      </div>

      <div className="bg-green-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{Math.round(accuracy)}%</div>
        <div className="text-sm text-green-500 font-medium">Accuracy</div>
      </div>

      <div className="bg-purple-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-purple-600">{formatTime(timeElapsed)}</div>
        <div className="text-sm text-purple-500 font-medium">Time</div>
      </div>
    </div>
  );
}