import React from 'react';

interface ScreenIdleProps {
  countdown: number;
  onCancel: () => void;
}

export default function ScreenIdle({ countdown, onCancel }: ScreenIdleProps) {
  const handleClick = (e: React.MouseEvent) => {
    // If clicking anywhere on the screen (not just the button), cancel idle
    onCancel();
  };

  return (
    <div 
      className="w-full h-full cursor-pointer flex items-center justify-center"
      onClick={handleClick}
    >
      <div className="relative z-10 text-center max-w-md">
        <h1 className="text-5xl font-bold text-white mb-6">
          Still there?
        </h1>
        <p className="text-3xl text-white mb-8">
          Starting over in {countdown}...
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent double-trigger
            onCancel();
          }}
          className="px-8 py-4 bg-white text-gray-900 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
        >
          CONTINUE
        </button>
        <p className="text-lg text-gray-400 mt-4">
          Click anywhere to continue
        </p>
      </div>
    </div>
  );
}