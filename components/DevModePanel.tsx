'use client';

import React, { useState, useEffect } from 'react';
import { ScaleReading } from '../transport/transport';
import { AppState } from '../lib/state';

interface DevModePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendReading: (reading: ScaleReading) => void;
  onSetWeight: (weight: number) => void;
  currentState: AppState;
  currentWeight: number;
  isStable: boolean;
}

export default function DevModePanel({
  isOpen,
  onClose,
  onSendReading,
  onSetWeight,
  currentState,
  currentWeight,
  isStable
}: DevModePanelProps) {
  const [manualWeight, setManualWeight] = useState(50);
  const [simulateStable, setSimulateStable] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const [autoSendInterval, setAutoSendInterval] = useState(500);

  // Auto-send readings if enabled
  useEffect(() => {
    if (!isOpen || !autoSend) return;

    const interval = setInterval(() => {
      const reading: ScaleReading = {
        grams: manualWeight,
        stable: simulateStable,
        ts: Date.now(),
      };
      onSendReading(reading);
    }, autoSendInterval);

    return () => clearInterval(interval);
  }, [isOpen, autoSend, manualWeight, simulateStable, autoSendInterval, onSendReading]);

  if (!isOpen) return null;

  const handleSendReading = () => {
    const reading: ScaleReading = {
      grams: manualWeight,
      stable: simulateStable,
      ts: Date.now(),
    };
    onSendReading(reading);
  };

  const presetWeights = [0, 10, 25, 50, 75, 100, 150, 200];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Developer Mode</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close (Ctrl+Shift+D)
          </button>
        </div>

        <div className="space-y-6">
          {/* Current State Info */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Current State</h3>
            <div className="text-gray-300">
              <div>State: <span className="font-mono text-blue-400">{currentState}</span></div>
              <div>Weight: <span className="font-mono text-blue-400">{currentWeight.toFixed(1)}g</span></div>
              <div>Stable: <span className="font-mono text-blue-400">{isStable ? 'Yes' : 'No'}</span></div>
            </div>
          </div>

          {/* Manual Weight Input */}
          <div>
            <label className="block text-white text-lg mb-2">
              Manual Weight: <span className="font-bold text-blue-400">{manualWeight}g</span>
            </label>
            <input
              type="range"
              min="0"
              max="500"
              step="1"
              value={manualWeight}
              onChange={(e) => setManualWeight(Number(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
            />
            <input
              type="number"
              min="0"
              max="500"
              value={manualWeight}
              onChange={(e) => setManualWeight(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
            />
            
            {/* Preset Buttons */}
            <div className="mt-2 flex gap-2 flex-wrap">
              {presetWeights.map((weight) => (
                <button
                  key={weight}
                  onClick={() => setManualWeight(weight)}
                  className={`px-3 py-1 rounded text-sm ${
                    manualWeight === weight
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {weight}g
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={simulateStable}
                onChange={(e) => setSimulateStable(e.target.checked)}
                className="w-5 h-5"
              />
              <span>Mark reading as stable</span>
            </label>

            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                className="w-5 h-5"
              />
              <span>Auto-send readings</span>
            </label>

            {autoSend && (
              <div>
                <label className="block text-white text-sm mb-1">
                  Auto-send interval: <span className="font-bold text-blue-400">{autoSendInterval}ms</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={autoSendInterval}
                  onChange={(e) => setAutoSendInterval(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSendReading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              Send Reading Now
            </button>
            <button
              onClick={() => onSetWeight(manualWeight)}
              className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
            >
              Set Weight
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-gray-700 rounded p-4 text-sm text-gray-300">
            <h3 className="font-semibold text-white mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Adjust the weight slider or enter a value manually</li>
              <li>Click &quot;Send Reading Now&quot; to send a reading to the system</li>
              <li>Enable &quot;Auto-send readings&quot; to continuously send readings</li>
              <li>Enable &quot;Mark reading as stable&quot; to bypass weight stability checks</li>
              <li>In dev mode, you can enter NetID without waiting for stable weight</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

