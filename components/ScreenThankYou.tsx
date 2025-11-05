import React from 'react';

interface ScreenThankYouProps {
  onExit: () => void;
}

export default function ScreenThankYou({ onExit }: ScreenThankYouProps) {
  return (
    <div className="min-h-screen bg-dark-slate flex items-center justify-center p-8">
      {/* Large circular ring background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 border-8 border-slate-700 rounded-full opacity-50"></div>
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold text-white mb-8">Thank you!</h1>
        <p className="text-3xl text-white mb-12">You&apos;re all set.</p>
        <button
          onClick={onExit}
          className="px-8 py-4 bg-white text-gray-900 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
        >
          EXIT
        </button>
      </div>
    </div>
  );
}


