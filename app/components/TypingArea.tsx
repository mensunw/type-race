'use client';

import { useEffect, useRef } from 'react';

interface TypingAreaProps {
  words: string[];
  currentWordIndex: number;
  currentWordInput: string;
  completedWords: string[];
  isGameActive: boolean;
  skippedWords: Set<number>;
  onInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function TypingArea({
  words,
  currentWordIndex,
  currentWordInput,
  completedWords,
  isGameActive,
  skippedWords,
  onInputChange,
  onKeyPress,
}: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGameActive && inputRef.current) {
      inputRef.current.focus();
    } else if (!isGameActive && textContainerRef.current) {
      // Reset scroll position to top when game becomes inactive
      // Use setTimeout to ensure DOM updates are complete
      setTimeout(() => {
        if (textContainerRef.current) {
          textContainerRef.current.scrollTop = 0;
          textContainerRef.current.scrollTo({
            top: 0,
            behavior: 'instant'
          });
        }
      }, 0);
    }
  }, [isGameActive]);

  // Also reset scroll when currentWordIndex resets to 0 (additional safety)
  useEffect(() => {
    if (currentWordIndex === 0 && textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }
  }, [currentWordIndex]);

  // Auto-scroll logic when currentWordIndex changes
  useEffect(() => {
    if (textContainerRef.current && isGameActive) {
      const container = textContainerRef.current;
      const currentWordElement = container.querySelector(`[data-word-index="${currentWordIndex}"]`);

      if (currentWordElement) {
        currentWordElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [currentWordIndex, isGameActive]);

  const hasWordError = (wordIndex: number) => {
    // Only show error if word is completed and has errors
    if (wordIndex >= completedWords.length) {
      return false; // Word not completed yet
    }

    const expectedWord = words[wordIndex] || '';
    const typedWord = completedWords[wordIndex];

    return skippedWords.has(wordIndex) || expectedWord !== typedWord;
  };

  const getCharacterClass = (wordIndex: number, charIndex: number, char: string, isCurrentWord: boolean) => {
    let baseClass = 'px-0.5 py-0.5 transition-colors duration-150';

    // Add underline for completed words with errors
    if (hasWordError(wordIndex)) {
      baseClass += ' underline decoration-red-500 decoration-2 decoration-solid';
    }

    if (isCurrentWord) {
      // Current word being typed
      const expectedWord = words[wordIndex] || '';

      if (charIndex < currentWordInput.length) {
        // Character has been typed
        if (charIndex < expectedWord.length && currentWordInput[charIndex] === expectedWord[charIndex]) {
          return `${baseClass} text-black`; // Correct
        } else {
          return `${baseClass} text-red-600`; // Incorrect or extra
        }
      } else if (charIndex === currentWordInput.length) {
        // Cursor position
        return `${baseClass} border-l-2 border-blue-500 text-gray-500`;
      } else {
        // Untyped characters
        return `${baseClass} text-gray-500`;
      }
    } else if (wordIndex < completedWords.length) {
      // Completed word
      const expectedWord = words[wordIndex] || '';
      const typedWord = completedWords[wordIndex];

      if (skippedWords.has(wordIndex)) {
        return `${baseClass} text-gray-500`; // Skipped word
      } else if (charIndex < typedWord.length) {
        if (charIndex < expectedWord.length && typedWord[charIndex] === expectedWord[charIndex]) {
          return `${baseClass} text-black`; // Correct
        } else {
          return `${baseClass} text-red-600`; // Incorrect
        }
      }
    }

    // Future words or spaces
    return `${baseClass} text-gray-500`;
  };

  return (
    <div className="mb-6">
      <div
        ref={textContainerRef}
        className="relative bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-6 mb-4 font-mono text-sm sm:text-lg leading-relaxed h-[6rem] sm:h-[7.2rem] overflow-y-auto break-words cursor-text scrollbar-hide"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* Internet Explorer 10+ */
        }}
        onClick={() => {
          if (isGameActive && inputRef.current) {
            inputRef.current.focus();
          }
        }}
      >
        <div className="flex flex-wrap">
          {words.map((expectedWord, wordIndex) => {
            const isCurrentWord = wordIndex === currentWordIndex;
            const isCompletedWord = wordIndex < completedWords.length;

            // Determine what to display for this word
            let displayWord = expectedWord;
            if (isCurrentWord) {
              // Show current word input (may be longer than expected)
              displayWord = currentWordInput.length > expectedWord.length
                ? currentWordInput
                : expectedWord;
            } else if (isCompletedWord) {
              // Show completed word (may be longer than expected)
              const typedWord = completedWords[wordIndex];
              displayWord = typedWord.length > expectedWord.length
                ? typedWord
                : expectedWord;
            }

            return (
              <span key={wordIndex} data-word-index={wordIndex}>
                {displayWord.split('').map((char, charIndex) => (
                  <span
                    key={`${wordIndex}-${charIndex}`}
                    className={getCharacterClass(wordIndex, charIndex, char, isCurrentWord)}
                  >
                    {char}
                  </span>
                ))}
                {/* Add cursor at end of current word if needed */}
                {isCurrentWord && currentWordInput.length === displayWord.length && (
                  <span className="border-l-2 border-blue-500 text-gray-500"></span>
                )}
                {/* Add space after each word except the last */}
                {wordIndex < words.length - 1 && (
                  <span className="px-0.5 py-0.5 text-black">
                    {'\u00A0'}
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {!isGameActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 rounded-lg z-10">
            <p className="text-gray-600 text-center font-medium">
              Click &quot;Start Race&quot; to begin
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={currentWordInput}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyPress}
        disabled={!isGameActive}
        className="sr-only"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
    </div>
  );
}