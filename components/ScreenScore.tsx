import React from 'react';
import CircleGauge from './CircleGauge';

interface ScreenScoreProps {
  score: number;
  comparisonText: string;
  onShowLeaderboard: () => void;
  onExit: () => void;
  onBack: () => void;
}

export default function ScreenScore({ 
  score, 
  comparisonText, 
  onShowLeaderboard, 
  onExit,
  onBack
}: ScreenScoreProps) {
  return (
    <div className="min-h-screen bg-dark-slate flex items-center justify-center p-8">
      {/* Back button */}
      <div className="absolute top-8 left-8 z-20">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg text-lg font-semibold hover:bg-gray-600 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
        >
          ← BACK
        </button>
      </div>
      
      <div className="flex items-center justify-between w-full max-w-6xl">
        {/* Left side - Text content */}
        <div className="flex-1 pr-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Thanks for checking in!
          </h1>
          
          <p className="text-3xl text-white mb-8 leading-relaxed">
            {comparisonText}
          </p>
          
          <p className="text-2xl text-white mb-12">
            Keep striving to keep your food waste low!
          </p>
          
          {/* Action buttons */}
          <div className="flex gap-6">
            <button
              onClick={onShowLeaderboard}
              className="px-8 py-4 bg-white text-gray-900 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
            >
              LEADERBOARD
            </button>
            <button
              onClick={onExit}
              className="px-8 py-4 bg-white text-gray-900 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
            >
              EXIT
            </button>
          </div>
        </div>
        
        {/* Right side - Score gauge */}
        <div className="flex-1 flex justify-center">
          <CircleGauge score={score} size={300} strokeWidth={25} />
        </div>
      </div>
    </div>
  );
}
