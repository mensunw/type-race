interface TrackProps {
  playerProgress: number;
  botProgress: number;
}

export default function Track({ playerProgress, botProgress }: TrackProps) {
  return (
    <div className="w-full bg-gray-100 rounded-lg p-4 mb-6">
      <div className="relative h-24 bg-gradient-to-r from-green-200 to-green-400 rounded-lg border-2 border-gray-300 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="flex items-center justify-between h-full px-2">
            <div className="text-2xl">🏁</div>
            <div className="text-2xl">🏆</div>
          </div>
        </div>

        <div
          className="absolute top-2 transition-all duration-300 ease-out"
          style={{ left: `${Math.min(playerProgress, 95)}%` }}
        >
          <div className="text-2xl transform -translate-x-1/2">🏎️</div>
          <div className="text-xs font-semibold text-blue-600 whitespace-nowrap transform -translate-x-1/2">
            You
          </div>
        </div>

        <div
          className="absolute bottom-2 transition-all duration-300 ease-out"
          style={{ left: `${Math.min(botProgress, 95)}%` }}
        >
          <div className="text-2xl transform -translate-x-1/2">🤖</div>
          <div className="text-xs font-semibold text-red-600 whitespace-nowrap transform -translate-x-1/2">
            Bot
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full opacity-20">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="absolute top-1/2 w-0.5 h-8 bg-white transform -translate-y-1/2"
                style={{ left: `${(i + 1) * 10}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}