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

  useEffect(() => {
    if (isGameActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isGameActive]);

  const getCharacterClass = (index: number) => {
    if (index < userInput.length) {
      // Spaces are always highlighted green
      if (text[index] === ' ') {
        return 'bg-green-200 text-green-800';
      }
      // Check if character was skipped via spacebar
      if (skippedChars.has(index)) {
        return 'bg-gray-200 text-gray-600';
      }
      // Normal typing: green for correct, red for incorrect
      return userInput[index] === text[index] ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';
    } else if (index === currentIndex) {
      return 'bg-blue-200 border-2 border-blue-400';
    }
    return 'text-gray-600';
  };

  return (
    <div className="mb-6">
      <div
        className="relative bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-6 mb-4 font-mono text-sm sm:text-lg leading-relaxed min-h-[120px] max-h-[200px] overflow-y-auto break-words cursor-text"
        onClick={() => {
          if (isGameActive && inputRef.current) {
            inputRef.current.focus();
          }
        }}
      >
        <div className="flex flex-wrap">
          {text.split('').map((char, index) => (
            <span
              key={index}
              className={`px-0.5 py-0.5 rounded transition-colors duration-150 ${getCharacterClass(index)}`}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>

        {!isGameActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-lg">
            <p className="text-gray-600 text-center">
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