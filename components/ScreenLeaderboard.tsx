import React from 'react';
import { LeaderboardEntry } from '../lib/supabase';

interface ScreenLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  onSubmitInitials: (initials: string) => void;
  onExit: () => void;
  onBack: () => void;
}

export default function ScreenLeaderboard({ 
  leaderboard, 
  onSubmitInitials, 
  onExit,
  onBack
}: ScreenLeaderboardProps) {
  const [initials, setInitials] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initials.trim().length === 3) {
      onSubmitInitials(initials.trim().toUpperCase());
      setIsSubmitted(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Generate entries based on actual leaderboard size + 1 for new entry
  const displayEntries = React.useMemo(() => {
    const actualEntries = leaderboard.length;
    const totalSlots = actualEntries + 1; // +1 for the new entry slot
    
    return Array.from({ length: totalSlots }, (_, index) => {
      const entry = leaderboard[index];
      const rank = index + 1;
      
      if (entry) {
        return { ...entry, rank, isPlaceholder: false };
      } else if (rank === totalSlots && !isSubmitted) {
        // Show input for the last slot (new entry)
        return { 
          initials: '', 
          score: 0, 
          ts: 0, 
          rank, 
          isPlaceholder: false, 
          isInput: true 
        };
      } else {
        return { 
          initials: '---', 
          score: 0, 
          ts: 0, 
          rank, 
          isPlaceholder: true 
        };
      }
    });
  }, [leaderboard, isSubmitted]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-blue-400';
    if (rank === 3) return 'bg-yellow-500';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-dark-slate flex flex-col items-center justify-center p-8">
      {/* Large circular ring background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 border-8 border-slate-700 rounded-full opacity-50"></div>
      </div>
      
      {/* Back button */}
      <div className="absolute top-8 left-8 z-20">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg text-lg font-semibold hover:bg-gray-600 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
        >
          ← BACK
        </button>
      </div>
      
      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Leaderboard
          </h1>
          {leaderboard.length === 0 && (
            <p className="text-xl text-gray-300">
              Be the first to make the leaderboard!
            </p>
          )}
        </div>
        
        {/* Leaderboard entries */}
        <div className="space-y-4 mb-12">
          {displayEntries.map((entry, index) => (
            <div key={index} className="flex items-center gap-6">
              {/* Rank circle */}
              <div className={`w-16 h-16 rounded-full ${getRankColor(entry.rank)} flex items-center justify-center`}>
                <span className="text-white font-bold text-xl">{entry.rank}</span>
              </div>
              
              {/* Initials or input */}
              {entry.isInput && !isSubmitted ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-4 flex-1">
                  <input
                    id="initials"
                    name="initials"
                    type="text"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))}
                    onKeyPress={handleKeyPress}
                    placeholder="TYPE YOUR THREE INITIALS HERE..."
                    className="px-6 py-4 text-xl bg-white text-gray-900 rounded-lg flex-1 focus:outline-none focus:ring-4 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label="Submit initials"
                  >
                    <svg
                      className="w-8 h-8 text-gray-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </form>
              ) : (
                <span className="text-white text-3xl font-semibold flex-1">
                  {entry.initials}
                </span>
              )}
              
              {/* Score */}
              {!entry.isPlaceholder && (
                <span className="text-white text-2xl font-semibold">
                  {entry.score}%
                </span>
              )}
              
              {/* Separator line */}
              <div className="flex-1 h-px bg-gray-600"></div>
            </div>
          ))}
        </div>
        
        {/* Footer message */}
        {isSubmitted && (
          <div className="text-center">
            <p className="text-3xl text-white font-semibold mb-8">
              See you next meal!
            </p>
            <button
              onClick={onExit}
              className="px-8 py-4 bg-white text-gray-900 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
            >
              EXIT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
