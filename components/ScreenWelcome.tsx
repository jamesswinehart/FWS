import React from 'react';

interface ScreenWelcomeProps {
  onSubmitNetId: (netId: string) => void;
}

export default function ScreenWelcome({ onSubmitNetId }: ScreenWelcomeProps) {
  const [netId, setNetId] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (netId.trim()) {
      onSubmitNetId(netId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-dark-slate flex items-center justify-center p-8">
      {/* Large circular ring background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 border-8 border-slate-700 rounded-full opacity-50"></div>
      </div>
      
      <div className="relative z-10 text-center max-w-2xl">
        {/* Welcome heading */}
        <h1 className="text-6xl font-bold text-white mb-8">
          Welcome!
        </h1>
        
        {/* Instructions */}
        <div className="text-2xl text-white mb-12 leading-relaxed">
          <p>Set your dish on the scale and enter your NetID to</p>
          <p>receive your Food Waste Score for this meal.</p>
        </div>
        
        {/* NetID input form */}
        <form onSubmit={handleSubmit} className="flex items-center justify-center gap-4">
          <input
            id="netid"
            name="netid"
            type="text"
            value={netId}
            onChange={(e) => setNetId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="NETID..."
            className="px-6 py-4 text-xl bg-white text-gray-900 rounded-lg w-80 focus:outline-none focus:ring-4 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Submit NetID"
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
      </div>
    </div>
  );
}
