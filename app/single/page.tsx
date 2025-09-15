'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Track from '../components/Track';
import Stats from '../components/Stats';
import TypingArea from '../components/TypingArea';
import EndGameModal from '../components/EndGameModal';

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog. This pangram contains all letters of the alphabet and is commonly used for typing practice. Speed and accuracy are both important when learning to type efficiently. In the digital age, typing has become an essential skill for students, professionals, and everyday computer users. The ability to type quickly and accurately can significantly improve productivity and communication. Many people spend hours each day using keyboards, whether for work, education, or personal activities. Touch typing, which involves typing without looking at the keyboard, is considered the most efficient method. It allows typists to focus on the content they are creating rather than searching for individual keys. Learning proper finger placement and muscle memory takes practice and dedication. The home row keys serve as the foundation for touch typing technique. Each finger has designated keys to press, and with consistent practice, the movements become automatic. Regular typing exercises help develop speed while maintaining accuracy. It is better to type slowly and correctly than to type quickly with many errors. Proofreading and editing skills are equally important as typing speed. Many typing programs and games are available to help people improve their skills. These tools often include lessons, tests, and challenges that make learning more engaging and fun. Some focus on specific areas like number typing, special characters, or programming symbols. Setting realistic goals and tracking progress can help maintain motivation during the learning process. Professional typists and data entry specialists can achieve typing speeds of over one hundred words per minute. However, for most people, a typing speed of thirty to fifty words per minute is sufficient for daily tasks. The key is finding the right balance between speed and accuracy for your specific needs and requirements.";

const BOT_WPM = 45;

export default function SinglePlayerPage() {
  const router = useRouter();

  const [gameState, setGameState] = useState<'waiting' | 'active' | 'finished'>('waiting');
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalTypedChars, setTotalTypedChars] = useState(0);
  const [botProgress, setBotProgress] = useState(0);
  const [winner, setWinner] = useState<'player' | 'bot' | null>(null);
  const [skippedChars, setSkippedChars] = useState<Set<number>>(new Set());

  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const botTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const playerProgress = (correctChars / SAMPLE_TEXT.length) * 100;
  const wpm = startTime && timeElapsed > 0 ? (correctChars / 5) / (timeElapsed / 60) : 0;
  const accuracy = totalTypedChars > 0 ? (correctChars / totalTypedChars) * 100 : 100;

  const startGame = useCallback(() => {
    setGameState('active');
    setStartTime(Date.now());
    setTimeElapsed(0);
    setUserInput('');
    setCurrentIndex(0);
    setCorrectChars(0);
    setTotalTypedChars(0);
    setBotProgress(0);
    setWinner(null);
    setSkippedChars(new Set());
  }, []);

  const resetGame = useCallback(() => {
    setGameState('waiting');
    setUserInput('');
    setCurrentIndex(0);
    setCorrectChars(0);
    setTotalTypedChars(0);
    setBotProgress(0);
    setWinner(null);
    setTimeElapsed(0);
    setStartTime(null);
    setSkippedChars(new Set());

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

      const botSpeed = BOT_WPM / 60 / 5;
      botTimerRef.current = setInterval(() => {
        setBotProgress(prev => {
          const newProgress = prev + (botSpeed / SAMPLE_TEXT.length) * 100;
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
  }, [gameState, endGame]);

  useEffect(() => {
    if (playerProgress >= 100 && gameState === 'active') {
      endGame('player');
    }
  }, [playerProgress, gameState, endGame]);

  const handleInputChange = (value: string) => {
    if (gameState !== 'active') return;

    if (value.length <= SAMPLE_TEXT.length) {
      setUserInput(value);
      setCurrentIndex(value.length);

      let correct = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] === SAMPLE_TEXT[i] && !skippedChars.has(i)) {
          correct++;
        }
      }
      setCorrectChars(correct);
      setTotalTypedChars(value.length);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (gameState === 'waiting' && e.key !== 'Tab') {
      startGame();
      return;
    }

    if (gameState === 'active' && e.key === ' ') {
      e.preventDefault();

      // Don't allow consecutive spaces
      if (userInput.length > 0 && userInput[userInput.length - 1] === ' ') {
        return;
      }

      // Find the next word boundary (next space or end of text)
      let nextSpaceIndex = SAMPLE_TEXT.indexOf(' ', currentIndex);
      if (nextSpaceIndex === -1) {
        // No more spaces, go to end of text
        nextSpaceIndex = SAMPLE_TEXT.length;
      } else {
        // Include the space
        nextSpaceIndex += 1;
      }

      // Preserve existing user input and add the skipped portion
      const skippedPortion = SAMPLE_TEXT.substring(currentIndex, nextSpaceIndex);
      const newInput = userInput + skippedPortion;
      setUserInput(newInput);
      setCurrentIndex(newInput.length);

      // Mark characters from current position to next space as skipped
      const newSkippedChars = new Set(skippedChars);
      for (let i = currentIndex; i < nextSpaceIndex; i++) {
        newSkippedChars.add(i);
      }
      setSkippedChars(newSkippedChars);

      // Update correct chars and total typed chars
      // Only count characters that were actually typed correctly (not skipped)
      let correct = 0;
      for (let i = 0; i < newInput.length; i++) {
        if (newInput[i] === SAMPLE_TEXT[i] && !newSkippedChars.has(i)) {
          correct++;
        }
      }
      setCorrectChars(correct);
      setTotalTypedChars(newInput.length);
    }

    if (gameState === 'active' && e.key === 'Backspace') {
      e.preventDefault();

      if (userInput.length === 0) {
        return; // Nothing to delete
      }

      // Find the first skipped character from the end moving backwards
      let targetIndex = currentIndex - 1;

      // If we're currently at a skipped character, find the first skipped character in the current sequence
      if (skippedChars.has(targetIndex)) {
        while (targetIndex > 0 && skippedChars.has(targetIndex)) {
          targetIndex--;
        }
        targetIndex++; // Move to the first skipped character
      } else {
        // Normal backspace - just go back one character
        targetIndex = currentIndex - 1;
      }

      // Update user input and position
      const newInput = userInput.substring(0, targetIndex);
      setUserInput(newInput);
      setCurrentIndex(newInput.length);

      // Update skipped characters - remove any that are now beyond our position
      const newSkippedChars = new Set(skippedChars);
      for (let i = targetIndex; i < userInput.length; i++) {
        newSkippedChars.delete(i);
      }
      setSkippedChars(newSkippedChars);

      // Update correct chars count
      let correct = 0;
      for (let i = 0; i < newInput.length; i++) {
        if (newInput[i] === SAMPLE_TEXT[i] && !newSkippedChars.has(i)) {
          correct++;
        }
      }
      setCorrectChars(correct);
      setTotalTypedChars(newInput.length);
    }
  };

  const goHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">🏁 Single Player Race</h1>
            <button
              onClick={goHome}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              ← Back to Home
            </button>
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

          <TypingArea
            text={SAMPLE_TEXT}
            userInput={userInput}
            currentIndex={currentIndex}
            isGameActive={gameState === 'active'}
            skippedChars={skippedChars}
            onInputChange={handleInputChange}
            onKeyPress={handleKeyPress}
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

            {gameState === 'active' && (
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
                💡 <strong>Tip:</strong> Start typing or click &quot;Start Race&quot; to begin!
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
    </div>
  );
}