import React from 'react';

interface LoginScreenProps {
  onLogin: (password: string) => void;
  error?: string;
}

export default function LoginScreen({ onLogin, error }: LoginScreenProps) {
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    setIsLoading(true);
    try {
      await onLogin(password);
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-dark-slate flex items-center justify-center p-8">
      <div className="relative z-10 text-center max-w-md w-full">
        {/* Logo/Title */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">FWS</h1>
          <p className="text-2xl text-gray-300">Food Waste Score</p>
          <p className="text-lg text-gray-400 mt-2">Kiosk Access</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-lg text-white mb-3">
              Enter Access Code
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="••••••••"
              className="w-full px-6 py-4 text-xl bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500 text-center tracking-widest"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-lg font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!password.trim() || isLoading}
            className="w-full py-4 px-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xl font-semibold rounded-lg transition-colors"
          >
            {isLoading ? 'Authenticating...' : 'Access Kiosk'}
          </button>
        </form>

        {/* Instructions */}
        <div className="mt-12 text-gray-400 text-sm">
          <p>Contact your administrator for access</p>
        </div>
      </div>
    </div>
  );
}
