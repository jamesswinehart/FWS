'use client';

import React from 'react';
import LoginScreen from '../../components/LoginScreen';

export default function LoginPage() {
  const [error, setError] = React.useState<string>('');

  const handleLogin = async (password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to main app
        window.location.href = '/';
      } else {
        setError(data.error || 'Invalid access code');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    }
  };

  return <LoginScreen onLogin={handleLogin} error={error} />;
}
