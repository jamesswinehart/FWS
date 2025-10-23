import React from 'react';
import { ScaleTransport } from '../transport/transport';
import { getLeaderboardStats } from '../lib/leaderboard-api';
import { LeaderboardEntry } from '../lib/supabase';

interface StatusBarProps {
  transport: ScaleTransport;
  mealPeriod: string;
  idleCountdown?: number;
  leaderboard?: LeaderboardEntry[];
}

export default function StatusBar({ transport, mealPeriod, idleCountdown, leaderboard = [] }: StatusBarProps) {
  const [showDebug, setShowDebug] = React.useState(false);

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
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            transport.isConnected() ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {transport.isConnected() ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-gray-300">
            Meal: {mealPeriod}
          </span>
          <span className="text-gray-300">
            Tare: {transport.getOffset().toFixed(1)}g
          </span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            idleCountdown && idleCountdown <= 10 ? 'bg-red-600' : 
            idleCountdown && idleCountdown <= 20 ? 'bg-yellow-600' : 'bg-blue-600'
          }`}>
            Idle: {idleCountdown}s
          </span>
        </div>
        
        {showDebug && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-300 mb-2">
              Idle: {idleCountdown}s
            </div>
            <div className="text-xs text-gray-300 mb-2">
              Debug: Timer should count down every second
            </div>
            
            {/* Leaderboard Stats */}
            <div className="text-xs text-gray-300 mb-2">
              <div>Leaderboard Stats:</div>
              <div>Entries: {getLeaderboardStats(leaderboard).totalEntries}</div>
              <div>Avg Score: {getLeaderboardStats(leaderboard).averageScore}%</div>
              <div>High Score: {getLeaderboardStats(leaderboard).highestScore}%</div>
            </div>
            
            <button
              onClick={handleReconnect}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors mr-2"
            >
              Reconnect Scale
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('testIdle'))}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs transition-colors"
            >
              Test Idle
            </button>
            <button
              onClick={() => {
                // Force idle countdown to 0
                window.dispatchEvent(new CustomEvent('forceIdle'));
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors mr-2"
            >
              Force Idle
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
