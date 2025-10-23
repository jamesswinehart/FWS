import React from 'react';
import { DishType } from '../lib/fws';

interface ScreenDishTypeProps {
  onSelectDish: (dishType: DishType) => void;
  onBack: () => void;
}

export default function ScreenDishType({ onSelectDish, onBack }: ScreenDishTypeProps) {
  const dishOptions: { type: DishType; label: string }[] = [
    { type: 'plate', label: 'PLATE' },
    { type: 'salad', label: 'SALAD BOWL' },
    { type: 'cereal', label: 'CEREAL BOWL' },
  ];

  return (
    <div className="min-h-screen bg-dark-slate flex items-center justify-center p-8">
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
      
      <div className="relative z-10 flex items-center justify-between w-full max-w-6xl">
        {/* Question text on the left */}
        <div className="flex-1 pr-16">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Is this dish a<br />
            plate, salad<br />
            bowl, or cereal<br />
            bowl?
          </h1>
        </div>
        
        {/* Selection buttons on the right */}
        <div className="flex-1 flex flex-col gap-6">
          {dishOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => onSelectDish(option.type)}
              className="px-8 py-6 bg-white text-gray-900 rounded-lg text-2xl font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
