'use client';

interface MultiplayerCountdownProps {
  countdownPhase: number | null;
  countdownTimeRemaining: number;
}

export default function MultiplayerCountdown({ countdownPhase, countdownTimeRemaining }: MultiplayerCountdownProps) {
  if (countdownPhase === null) {
    return null;
  }

  const getLightColor = () => {
    if (countdownPhase === 3 || countdownPhase === 2) return 'bg-red-500';
    if (countdownPhase === 1) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (countdownPhase === 3 || countdownPhase === 2) return 'text-red-600';
    if (countdownPhase === 1) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 rounded-lg z-20">
      <div className="text-center">
        {/* Traffic Light */}
        <div className="flex justify-center mb-2">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getLightColor()} animate-pulse shadow-lg`}></div>
        </div>

        <div className={`text-3xl sm:text-4xl font-bold animate-pulse ${getTextColor()}`}>
          {countdownPhase > 0 ? countdownPhase : 'Go!'}
        </div>
        {countdownPhase > 0 && (
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Get ready to race!
          </p>
        )}
        {countdownPhase === 0 && (
          <p className="text-sm sm:text-base text-green-600 mt-1 font-semibold">
            Start typing!
          </p>
        )}
      </div>
    </div>
  );
}