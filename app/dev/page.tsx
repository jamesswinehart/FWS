'use client';

import React, { useState, useEffect } from 'react';
import CircleGauge from '../../components/CircleGauge';

export default function DevMode() {
  const [score, setScore] = useState(75);
  const [gaugeSize, setGaugeSize] = useState(300);
  const [strokeWidth, setStrokeWidth] = useState(25);

  // Preset scores for quick testing
  const presetScores = [0, 25, 50, 75, 100];

  // Enable scrolling for dev page
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark-slate p-8">
      <div className="max-w-7xl mx-auto pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Development Mode - Score Visualizer</h1>
          <p className="text-gray-300">Adjust the score to test the meter and take screenshots</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Controls</h2>
            
            {/* Score Slider */}
            <div>
              <label className="block text-white text-lg mb-2">
                Score: <span className="font-bold text-blue-400">{score}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Preset Buttons */}
            <div>
              <label className="block text-white text-lg mb-2">Quick Presets:</label>
              <div className="flex gap-2 flex-wrap">
                {presetScores.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setScore(preset)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      score === preset
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            {/* Gauge Size Control */}
            <div>
              <label className="block text-white text-lg mb-2">
                Gauge Size: <span className="font-bold text-blue-400">{gaugeSize}px</span>
              </label>
              <input
                type="range"
                min="150"
                max="500"
                step="10"
                value={gaugeSize}
                onChange={(e) => setGaugeSize(Number(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Stroke Width Control */}
            <div>
              <label className="block text-white text-lg mb-2">
                Stroke Width: <span className="font-bold text-blue-400">{strokeWidth}px</span>
              </label>
              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Keyboard Shortcuts */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-white font-semibold mb-2">Keyboard Shortcuts:</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">↑</kbd> / <kbd className="px-2 py-1 bg-gray-700 rounded">↓</kbd> - Adjust score by 1</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">Shift + ↑</kbd> / <kbd className="px-2 py-1 bg-gray-700 rounded">Shift + ↓</kbd> - Adjust score by 10</li>
                <li><kbd className="px-2 py-1 bg-gray-700 rounded">1-5</kbd> - Jump to preset scores</li>
              </ul>
            </div>
          </div>

          {/* Right: Visual Preview */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Preview</h2>
            
            {/* Full ScreenScore-like Preview */}
            <div className="bg-dark-slate rounded-lg p-8 min-h-[600px] flex flex-col items-center justify-center">
              <div className="w-full max-w-6xl">
                {/* Text Content */}
                <div className="mb-8 text-center">
                  <h1 className="text-5xl font-bold text-white mb-6">
                    Thanks for checking in!
                  </h1>
                  <p className="text-3xl text-white mb-8">
                    {score >= 80 
                      ? "Excellent! You're doing great!"
                      : score >= 60
                      ? "Good job! Keep it up!"
                      : score >= 40
                      ? "You can do better next time."
                      : "Let's work on reducing food waste."}
                  </p>
                </div>
                
                {/* Gauge Display */}
                <div className="flex justify-center">
                  <CircleGauge 
                    score={score} 
                    size={gaugeSize} 
                    strokeWidth={strokeWidth}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Standalone Gauge View */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Standalone Gauge (for screenshots)</h2>
          <div className="bg-dark-slate rounded-lg p-12 flex justify-center items-center min-h-[400px]">
            <CircleGauge 
              score={score} 
              size={gaugeSize} 
              strokeWidth={strokeWidth}
            />
          </div>
        </div>
      </div>

      {/* Keyboard handlers */}
      <KeyboardHandlers score={score} setScore={setScore} />
    </div>
  );
}

function KeyboardHandlers({ score, setScore }: { score: number; setScore: (score: number) => void }) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Arrow keys for fine adjustment
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setScore(Math.min(100, score + (e.shiftKey ? 10 : 1)));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setScore(Math.max(0, score - (e.shiftKey ? 10 : 1)));
      }
      
      // Number keys for presets
      if (e.key === '1') setScore(0);
      if (e.key === '2') setScore(25);
      if (e.key === '3') setScore(50);
      if (e.key === '4') setScore(75);
      if (e.key === '5') setScore(100);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [score, setScore]);

  return null;
}

