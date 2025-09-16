'use client';

import { useEffect, useRef } from 'react';

interface TypingAreaProps {
  text: string;
  userInput: string;
  currentIndex: number;
  isGameActive: boolean;
  skippedChars: Set<number>;
  onInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function TypingArea({
  text,
  userInput,
  currentIndex,
  isGameActive,
  skippedChars,
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

  // Also reset scroll when currentIndex resets to 0 (additional safety)
  useEffect(() => {
    if (currentIndex === 0 && textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  // Auto-scroll logic when currentIndex changes
  useEffect(() => {
    if (textContainerRef.current && isGameActive) {
      const container = textContainerRef.current;

      // Find the current character element
      const currentCharElement = container.querySelector(`[data-char-index="${currentIndex}"]`);

      if (currentCharElement) {
        // Use scrollIntoView to ensure the current character is visible
        // with some padding to show upcoming text
        currentCharElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center', // Keep cursor in center of view
          inline: 'nearest'
        });
      }
    }
  }, [currentIndex, isGameActive]);

  const getWordBoundaries = () => {
    const words = [];
    let currentWord = { start: 0, end: 0 };

    for (let i = 0; i <= text.length; i++) {
      if (i === text.length || text[i] === ' ') {
        currentWord.end = i;
        words.push(currentWord);
        currentWord = { start: i + 1, end: i + 1 };
      }
    }

    return words;
  };

  const hasWordError = (wordStart: number, wordEnd: number) => {
    // Only show error underline if user has moved past this word
    if (currentIndex <= wordEnd) {
      return false; // User is still on or before this word
    }

    // Check if the completed word has any errors
    for (let i = wordStart; i < wordEnd; i++) {
      if (skippedChars.has(i) || (i < userInput.length && userInput[i] !== text[i])) {
        return true;
      }
    }
    return false;
  };

  const getCharacterClass = (index: number, wordHasError: boolean) => {
    let baseClass = 'px-0.5 py-0.5 transition-colors duration-150';

    if (wordHasError) {
      baseClass += ' underline decoration-red-500 decoration-2 decoration-solid';
    }

    if (index < userInput.length) {
      // Handle characters beyond the expected text (extra characters)
      if (index >= text.length) {
        return `${baseClass} text-red-600`; // Extra characters are always red
      }

      // Spaces are always highlighted black
      if (text[index] === ' ') {
        return `${baseClass} text-black`;
      }
      // Check if character was skipped via spacebar
      if (skippedChars.has(index)) {
        return `${baseClass} text-gray-500`;
      }
      // Normal typing: black for correct, red for incorrect
      if (userInput[index] === text[index]) {
        return `${baseClass} text-black`;
      } else {
        return `${baseClass} text-red-600`;
      }
    } else if (index === currentIndex) {
      return `${baseClass} border-l-2 border-blue-500 text-gray-500`;
    }
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
          {(() => {
            const words = getWordBoundaries();
            const displayText = userInput.length > text.length ? userInput : text;

            return displayText.split('').map((char, index) => {
              const currentWord = words.find(word => index >= word.start && index < word.end);
              const wordHasError = currentWord ? hasWordError(currentWord.start, currentWord.end) : false;

              return (
                <span
                  key={index}
                  data-char-index={index}
                  className={getCharacterClass(index, wordHasError)}
                  style={index === currentIndex ? { borderLeftStyle: 'solid', borderRadius: 0 } : {}}
                >
                  {index < text.length
                    ? (text[index] === ' ' ? '\u00A0' : text[index])
                    : (userInput[index] === ' ' ? '\u00A0' : userInput[index])
                  }
                </span>
              );
            });
          })()}
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
        value={userInput}
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