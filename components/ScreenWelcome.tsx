import React from 'react';

interface ScreenWelcomeProps {
  onSubmitNetId: (netId: string) => void;
  isWeightStable?: boolean;
}

export default function ScreenWelcome({ onSubmitNetId, isWeightStable = false }: ScreenWelcomeProps) {
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
        
        {/* Step-by-step instructions */}
        <div className="text-2xl mb-12 leading-relaxed text-left max-w-3xl mx-auto">
          <div className={`mb-3 transition-colors ${!isWeightStable ? 'text-white font-semibold' : 'text-gray-400'}`}>
            <span className={`inline-block w-3 h-3 mr-3 rounded-full ${!isWeightStable ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`}></span>
            Set your dish on the scale
          </div>
          <div className={`transition-colors ${isWeightStable ? 'text-white font-semibold' : 'text-gray-500'}`}>
            <span className={`inline-block w-3 h-3 mr-3 rounded-full ${isWeightStable ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></span>
            Enter your NetID
          </div>
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
            disabled={!isWeightStable}
            className={`px-6 py-4 text-xl rounded-lg w-80 focus:outline-none focus:ring-4 ${isWeightStable ? 'bg-white text-gray-900 focus:ring-blue-500' : 'bg-gray-600 text-gray-300 cursor-not-allowed'}`}
            autoFocus
          />
          <button
            type="submit"
            disabled={!isWeightStable}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isWeightStable ? 'bg-white hover:bg-gray-100' : 'bg-gray-600 cursor-not-allowed'}`}
            aria-label="Submit NetID"
          >
            <svg
              className={`w-8 h-8 ${isWeightStable ? 'text-gray-900' : 'text-gray-300'}`}
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
