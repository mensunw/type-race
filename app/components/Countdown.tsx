'use client';

import { useEffect, useState } from 'react';

interface CountdownProps {
  onComplete: () => void;
}

export default function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState(3);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // Show "Go!" for a brief moment before completing
      const goTimer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 800);

      return () => clearTimeout(goTimer);
    }
  }, [count, onComplete]);

  if (!isVisible) {
    return null;
  }

  const getLightColor = () => {
    if (count === 3 || count === 2) return 'bg-red-500';
    if (count === 1) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (count === 3 || count === 2) return 'text-red-600';
    if (count === 1) return 'text-yellow-600';
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
          {count > 0 ? count : 'Go!'}
        </div>
        {count > 0 && (
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Get ready to race!
          </p>
        )}
        {count === 0 && (
          <p className="text-sm sm:text-base text-green-600 mt-1 font-semibold">
            Start typing!
          </p>
        )}
      </div>
    </div>
  );
}