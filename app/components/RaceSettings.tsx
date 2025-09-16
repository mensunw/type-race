interface RaceSettingsProps {
  isOpen: boolean;
  targetCharCount: number;
  botDifficulty: string;
  onTargetCharCountChange: (count: number) => void;
  onBotDifficultyChange: (difficulty: string) => void;
  onClose: () => void;
  onApply: () => void;
}

export default function RaceSettings({
  isOpen,
  targetCharCount,
  botDifficulty,
  onTargetCharCountChange,
  onBotDifficultyChange,
  onClose,
  onApply,
}: RaceSettingsProps) {
  if (!isOpen) return null;

  const presets = [
    { name: "Quick Sprint", chars: 100 },
    { name: "Short Race", chars: 200 },
    { name: "Medium Race", chars: 400 },
    { name: "Long Race", chars: 600 },
    { name: "Marathon", chars: 1000 },
  ];

  const botDifficulties = [
    { name: "Easy", wpm: 41, description: "Beginner friendly" },
    { name: "Medium", wpm: 67, description: "Average challenge" },
    { name: "Hard", wpm: 97, description: "Expert level" },
    { name: "Very Hard", wpm: 120, description: "Professional" },
    { name: "Henry", wpm: 180, description: "Legendary" },
  ];

  const getEstimatedWords = (chars: number) => {
    return Math.round(chars / 5); // Average 5 characters per word
  };

  const getEstimatedTime = (chars: number) => {
    const avgWpm = 40; // Average typing speed
    const minutes = chars / 5 / avgWpm;
    return minutes < 1 ? `${Math.round(minutes * 60)}s` : `${Math.round(minutes)}m`;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">⚙️ Race Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Character Count
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={targetCharCount}
                onChange={(e) => onTargetCharCountChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>50</span>
                <span>1000</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{targetCharCount}</div>
                <div className="text-sm text-gray-600">characters to win</div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                ≈ {getEstimatedWords(targetCharCount)} words • ~{getEstimatedTime(targetCharCount)} at 40 WPM
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onTargetCharCountChange(preset.chars)}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    targetCharCount === preset.chars
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-xs opacity-75">{preset.chars} chars</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bot Difficulty
            </label>
            <div className="space-y-2">
              {botDifficulties.map((difficulty) => (
                <button
                  key={difficulty.name}
                  onClick={() => onBotDifficultyChange(difficulty.name)}
                  className={`w-full p-3 rounded-lg text-sm transition-colors flex justify-between items-center ${
                    botDifficulty === difficulty.name
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium">{difficulty.name}</div>
                    <div className="text-xs opacity-75">{difficulty.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{difficulty.wpm}</div>
                    <div className="text-xs opacity-75">WPM</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}