'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Track from '../components/Track';
import Stats from '../components/Stats';
import TypingArea from '../components/TypingArea';
import EndGameModal from '../components/EndGameModal';
import RaceSettings from '../components/RaceSettings';

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog. This pangram contains all letters of the alphabet and is commonly used for typing practice. Speed and accuracy are both important when learning to type efficiently. In the digital age, typing has become an essential skill for students, professionals, and everyday computer users. The ability to type quickly and accurately can significantly improve productivity and communication. Many people spend hours each day using keyboards, whether for work, education, or personal activities. Touch typing, which involves typing without looking at the keyboard, is considered the most efficient method. It allows typists to focus on the content they are creating rather than searching for individual keys. Learning proper finger placement and muscle memory takes practice and dedication. The home row keys serve as the foundation for touch typing technique. Each finger has designated keys to press, and with consistent practice, the movements become automatic. Regular typing exercises help develop speed while maintaining accuracy. It is better to type slowly and correctly than to type quickly with many errors. Proofreading and editing skills are equally important as typing speed. Many typing programs and games are available to help people improve their skills. These tools often include lessons, tests, and challenges that make learning more engaging and fun. Some focus on specific areas like number typing, special characters, or programming symbols. Setting realistic goals and tracking progress can help maintain motivation during the learning process. Professional typists and data entry specialists can achieve typing speeds of over one hundred words per minute. However, for most people, a typing speed of thirty to fifty words per minute is sufficient for daily tasks. The key is finding the right balance between speed and accuracy for your specific needs and requirements.";

// Bot difficulties mapping
const BOT_DIFFICULTIES = {
  'Easy': 41,
  'Medium': 67,
  'Hard': 97,
  'Very Hard': 120,
  'Henry': 180,
};

export default function SinglePlayerPage() {
  const router = useRouter();

  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'active' | 'finished'>('waiting');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWordInput, setCurrentWordInput] = useState('');
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalTypedChars, setTotalTypedChars] = useState(0);
  const [botProgress, setBotProgress] = useState(0);
  const [winner, setWinner] = useState<'player' | 'bot' | null>(null);
  const [skippedWords, setSkippedWords] = useState<Set<number>>(new Set());
  const [targetCharCount, setTargetCharCount] = useState(200); // Default to 200 characters
  const [botDifficulty, setBotDifficulty] = useState('Medium'); // Default to Medium
  const [showSettings, setShowSettings] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const botTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Split text into words for word-based typing
  const words = SAMPLE_TEXT.split(' ');

  // Calculate progress based on correct characters vs target
  const playerProgress = (correctChars / targetCharCount) * 100;
  const wpm = startTime && timeElapsed > 0 ? (correctChars / 5) / (timeElapsed / 60) : 0;
  const accuracy = totalTypedChars > 0 ? (correctChars / totalTypedChars) * 100 : 100;

  const startGame = useCallback(() => {
    setGameState('countdown');
    setTimeElapsed(0);
    setCurrentWordIndex(0);
    setCurrentWordInput('');
    setCompletedWords([]);
    setCorrectChars(0);
    setTotalTypedChars(0);
    setBotProgress(0);
    setWinner(null);
    setSkippedWords(new Set());
  }, []);

  const onCountdownComplete = useCallback(() => {
    setGameState('active');
    setStartTime(Date.now());
  }, []);

  const resetGame = useCallback(() => {
    setGameState('waiting');
    setCurrentWordIndex(0);
    setCurrentWordInput('');
    setCompletedWords([]);
    setCorrectChars(0);
    setTotalTypedChars(0);
    setBotProgress(0);
    setWinner(null);
    setTimeElapsed(0);
    setStartTime(null);
    setSkippedWords(new Set());

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (botTimerRef.current) {
      clearInterval(botTimerRef.current);
    }
  }, []);

  const endGame = useCallback((gameWinner: 'player' | 'bot') => {
    setGameState('finished');
    setWinner(gameWinner);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (botTimerRef.current) {
      clearInterval(botTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (gameState === 'active') {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);

      const currentBotWPM = BOT_DIFFICULTIES[botDifficulty as keyof typeof BOT_DIFFICULTIES];
      const botCharsPerSecond = (currentBotWPM * 5) / 60; // characters per second (5 chars per word, 60 seconds per minute)
      botTimerRef.current = setInterval(() => {
        setBotProgress(prev => {
          const newProgress = prev + (botCharsPerSecond / targetCharCount) * 100;
          if (newProgress >= 100) {
            endGame('bot');
            return 100;
          }
          return newProgress;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (botTimerRef.current) {
        clearInterval(botTimerRef.current);
      }
    };
  }, [gameState, endGame, targetCharCount, botDifficulty]);

  useEffect(() => {
    if (correctChars >= targetCharCount && gameState === 'active') {
      endGame('player');
    }
  }, [correctChars, targetCharCount, gameState, endGame]);

  const handleInputChange = (value: string) => {
    if (gameState !== 'active') return;

    // Extract just the current word being typed (remove any spaces)
    const currentInput = value.replace(/\s/g, '');
    setCurrentWordInput(currentInput);

    // Calculate stats
    let totalCorrect = 0;
    let totalTyped = 0;

    // Count correct chars from completed words
    for (let i = 0; i < completedWords.length; i++) {
      const expectedWord = words[i] || '';
      const typedWord = completedWords[i];
      totalTyped += typedWord.length + 1; // +1 for space

      if (!skippedWords.has(i)) {
        for (let j = 0; j < Math.min(expectedWord.length, typedWord.length); j++) {
          if (expectedWord[j] === typedWord[j]) {
            totalCorrect++;
          }
        }
        if (expectedWord === typedWord) {
          totalCorrect++; // +1 for correct space
        }
      }
    }

    // Count correct chars from current word
    if (currentWordIndex < words.length) {
      const expectedWord = words[currentWordIndex];
      totalTyped += currentInput.length;

      for (let i = 0; i < Math.min(expectedWord.length, currentInput.length); i++) {
        if (expectedWord[i] === currentInput[i]) {
          totalCorrect++;
        }
      }
    }

    setCorrectChars(totalCorrect);
    setTotalTypedChars(totalTyped);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (gameState === 'waiting' && e.key !== 'Tab') {
      startGame();
      return;
    }

    if (gameState === 'active' && e.key === ' ') {
      e.preventDefault();

      // Only allow spacebar advancement if user has typed something
      if (currentWordInput.length === 0) {
        return; // Ignore spacebar if no input for current word
      }

      // Complete current word and move to next
      if (currentWordIndex < words.length) {
        setCompletedWords([...completedWords, currentWordInput]);
        setCurrentWordInput('');
        setCurrentWordIndex(currentWordIndex + 1);
      }
    }

    if (gameState === 'active' && e.key === 'Backspace') {
      e.preventDefault();

      if (currentWordInput.length > 0) {
        // Remove character from current word
        setCurrentWordInput(currentWordInput.slice(0, -1));
      } else if (completedWords.length > 0) {
        // Go back to previous word
        const lastWord = completedWords[completedWords.length - 1];
        setCompletedWords(completedWords.slice(0, -1));
        setCurrentWordInput(lastWord);
        setCurrentWordIndex(Math.max(0, currentWordIndex - 1));
      }
    }
  };

  const goHome = () => {
    router.push('/');
  };

  const handleSettingsApply = () => {
    setShowSettings(false);
    // Reset game if settings changed while playing
    if (gameState === 'active') {
      resetGame();
    }
  };

  const handleTargetCharCountChange = (count: number) => {
    setTargetCharCount(count);
  };

  const handleBotDifficultyChange = (difficulty: string) => {
    setBotDifficulty(difficulty);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🏁 Single Player Race</h1>
              <p className="text-sm text-gray-600 mt-1">
                Race to {targetCharCount} correct characters!
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Race Settings"
              >
                ⚙️
              </button>
              <button
                onClick={goHome}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          <Track
            playerProgress={playerProgress}
            botProgress={botProgress}
          />

          <Stats
            wpm={wpm}
            accuracy={accuracy}
            timeElapsed={timeElapsed}
            isGameActive={gameState === 'active'}
          />

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
            <div className="text-lg font-semibold text-gray-800">
              {correctChars} / {targetCharCount} characters
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(playerProgress, 100)}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {targetCharCount - correctChars} characters remaining
            </div>
          </div>

          <TypingArea
            words={words}
            currentWordIndex={currentWordIndex}
            currentWordInput={currentWordInput}
            completedWords={completedWords}
            isGameActive={gameState === 'active'}
            isCountdownActive={gameState === 'countdown'}
            skippedWords={skippedWords}
            onInputChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onCountdownComplete={onCountdownComplete}
          />

          <div className="flex justify-center space-x-4">
            {gameState === 'waiting' && (
              <button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                🚀 Start Race
              </button>
            )}

            {(gameState === 'active' || gameState === 'countdown') && (
              <button
                onClick={resetGame}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                🔄 Reset
              </button>
            )}

            {gameState === 'finished' && (
              <button
                onClick={resetGame}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                🔄 Race Again
              </button>
            )}
          </div>

          {gameState === 'waiting' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-blue-800">
                💡 <strong>Tip:</strong> win
              </p>
            </div>
          )}
        </div>
      </div>

      <EndGameModal
        isOpen={gameState === 'finished'}
        winner={winner}
        wpm={wpm}
        accuracy={accuracy}
        timeElapsed={timeElapsed}
        onRestart={resetGame}
        onHome={goHome}
      />

      <RaceSettings
        isOpen={showSettings}
        targetCharCount={targetCharCount}
        botDifficulty={botDifficulty}
        onTargetCharCountChange={handleTargetCharCountChange}
        onBotDifficultyChange={handleBotDifficultyChange}
        onClose={() => setShowSettings(false)}
        onApply={handleSettingsApply}
      />
    </div>
  );
}