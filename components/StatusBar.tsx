import React from 'react';
import { ScaleTransport } from '../transport/transport';
import { HIDScale } from '../transport/transport.hid';
import { getLeaderboardStats } from '../lib/leaderboard-api';
import { LeaderboardEntry } from '../lib/supabase';

interface StatusBarProps {
  transport: ScaleTransport;
  mealPeriod: string;
  idleCountdown?: number;
  leaderboard?: LeaderboardEntry[];
  currentWeight?: number;
  isStable?: boolean;
  onDebugWeightChange?: (weight: number) => void;
}

export default function StatusBar({ transport, mealPeriod, idleCountdown, leaderboard = [], currentWeight = 0, isStable = false, onDebugWeightChange }: StatusBarProps) {
  const [showDebug, setShowDebug] = React.useState(false);
  const [debugWeight, setDebugWeight] = React.useState(50); // Default debug weight

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setShowDebug(prev => !prev);
      }
      // Test idle timer (press 't' to trigger idle warning)
      if (e.key === 't' || e.key === 'T') {
        // This will be handled by the main app component
        window.dispatchEvent(new CustomEvent('testIdle'));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleReconnect = async () => {
    try {
      await transport.disconnect();
      await transport.connect();
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-50">
      <div className="bg-gray-800 bg-opacity-90 rounded-lg p-3 text-sm text-white">
        <div className="flex items-center gap-4">
          <span className="text-gray-300">
            Weight: {currentWeight.toFixed(1)}g {isStable ? '(stable)' : ''}
          </span>
          {transport.isConnected() && (
            <span className="px-2 py-1 bg-green-600 rounded text-xs font-semibold">
              Scale Connected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
