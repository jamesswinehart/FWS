'use client';

import React, { useEffect, useCallback } from 'react';
import { HIDScale } from '../../transport/transport.hid';
import { ScaleTransport } from '../../transport/transport';
import { 
  AppState, 
  AppEvent, 
  AppContext, 
  appReducer, 
  applyActions, 
  getInitialContext 
} from '../../lib/state';
import { 
  calculateDishScore, 
  gateStable, 
  DishType 
} from '../../lib/fws';
import { 
  getCurrentMealPeriod, 
  getMealPeriodWithTime
} from '../../lib/meal-api';
import { 
  loadLeaderboard, 
  saveLeaderboard,
  addLeaderboardEntry,
  qualifiesForLeaderboard
} from '../../lib/leaderboard';
import type { LeaderboardEntry } from '../../lib/supabase';

// Components
import ScreenDishType from '../../components/ScreenDishType';
import ScreenScore from '../../components/ScreenScore';
import ScreenLeaderboard from '../../components/ScreenLeaderboard';
import ScreenIdle from '../../components/ScreenIdle';
import StatusBar from '../../components/StatusBar';
import DevModePanel from '../../components/DevModePanel';
import { ScaleReading } from '../../transport/transport';

export default function PresentationMode() {
  const [state, setState] = React.useState<AppState>('DISH_TYPE'); // Start at dish type, skip NetID
  const [context, setContext] = React.useState<AppContext>(() => {
    const initial = getInitialContext();
    // Set a demo NetID and always assign to treatment for presentation
    initial.netId = 'presentation';
    initial.treatmentGroup = 'treatment';
    // Load leaderboard from localStorage and convert to database format
    const localLeaderboard = loadLeaderboard();
    const currentMealPeriod = getCurrentMealPeriod();
    initial.leaderboard = localLeaderboard.map((e, index) => {
      // Safely handle timestamp - use current time if invalid
      let timestamp = e.ts;
      if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
        timestamp = Date.now();
      }
      const date = new Date(timestamp);
      // If date is still invalid, use current time
      const validDate = isNaN(date.getTime()) ? new Date() : date;
      
      return {
        id: index + 1, // Use numeric ID for compatibility
        initials: e.initials,
        score: e.score,
        netid: e.netId || 'presentation',
        meal_period: (e.mealPeriod || currentMealPeriod) as 'breakfast' | 'lunch' | 'dinner' | 'other',
        created_at: validDate.toISOString(),
      };
    });
    return initial;
  });
  const [debugWeightOverride, setDebugWeightOverride] = React.useState<number | null>(null);
  const [devMode, setDevMode] = React.useState(false);
  
  // Use refs to avoid dependency issues
  const stateRef = React.useRef(state);
  const contextRef = React.useRef(context);
  
  // Update refs when state/context changes
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  React.useEffect(() => {
    contextRef.current = context;
  }, [context]);
  
  const [transport] = React.useState<ScaleTransport>(() => new HIDScale());
  const mealPeriod = getCurrentMealPeriod();

  // Dispatch function for state machine (NO DATABASE SAVES)
  const dispatch = useCallback((event: AppEvent) => {
    console.log('=== DISPATCH ===', event.type, event);
    console.log('Current state:', stateRef.current);
    console.log('Current context readings:', contextRef.current.readings.length);
    
    const result = appReducer(stateRef.current, contextRef.current, event);
    
    console.log('New state:', result.state);
    console.log('Actions:', result.actions.map(a => a.type));
    
    setState(result.state);
    const newContext = applyActions(result.context, result.actions);
    setContext(newContext);
    
    // NOTE: We skip all database save actions in presentation mode
    // Only handle leaderboard updates (localStorage only)
  }, []);

  // Ensure we have at least one reading for score calculation when in DISH_TYPE state
  useEffect(() => {
    if (state === 'DISH_TYPE' && context.readings.length === 0) {
      console.log('Creating default reading for DISH_TYPE state');
      const defaultReading: ScaleReading = {
        grams: 0,
        stable: true,
        ts: Date.now(),
      };
      dispatch({ type: 'READING_UPDATE', reading: defaultReading });
    }
  }, [state, context.readings.length, dispatch]);

  // Handle scale readings and auto-connect
  useEffect(() => {
    const handleReading = (reading: any) => {
      dispatch({ type: 'READING_UPDATE', reading });
    };

    transport.onReading(handleReading);
    
    // Auto-connect to scale in presentation mode
    const connectScale = async () => {
      try {
        if (!transport.isConnected()) {
          await transport.connect();
          console.log('Scale connected in presentation mode');
        }
      } catch (error) {
        console.error('Failed to connect scale in presentation mode:', error);
        // Don't show error to user - scale connection is optional in presentation mode
      }
    };
    
    connectScale();
    
    return () => {
      transport.disconnect();
    };
  }, [transport, dispatch]);

  // Inactivity timer
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'IDLE_TICK' });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [dispatch]);

  // Dev mode keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleDevModeKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDevMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleDevModeKey);
    return () => window.removeEventListener('keydown', handleDevModeKey);
  }, []);

  // Function to send manual readings in dev mode
  const handleSendReading = useCallback((reading: ScaleReading) => {
    dispatch({ type: 'READING_UPDATE', reading });
  }, [dispatch]);

  // Function to set weight directly (for dev mode)
  const handleSetWeight = useCallback((weight: number) => {
    const reading: ScaleReading = {
      grams: weight,
      stable: true,
      ts: Date.now(),
    };
    dispatch({ type: 'READING_UPDATE', reading });
  }, [dispatch]);

  // User activity detection
  useEffect(() => {
    const handleUserActivity = () => {
      if (stateRef.current !== 'ERROR') {
        setContext(prev => ({ 
          ...prev, 
          idleCountdown: 25,
          showIdleWarning: false
        }));
      }
    };

    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, []);

  // Handlers
  const handleSelectDish = useCallback((dishType: DishType) => {
    console.log('=== handleSelectDish CALLED ===', dishType);
    console.log('Current state:', stateRef.current);
    console.log('Current readings count:', contextRef.current.readings.length);
    console.log('Treatment group:', contextRef.current.treatmentGroup);
    
    try {
      // Always ensure we have a reading - create it synchronously if needed
      let readingToUse = contextRef.current.readings[contextRef.current.readings.length - 1];
      
      if (!readingToUse) {
        console.log('No reading found, creating one synchronously');
        readingToUse = {
          grams: 0,
          stable: true,
          ts: Date.now(),
        };
        // Add reading first
        dispatch({ type: 'READING_UPDATE', reading: readingToUse });
      }
      
      // Dispatch dish selection - use a small delay to ensure reading is processed
      setTimeout(() => {
        console.log('Dispatching SELECT_DISH with dishType:', dishType);
        console.log('Readings at dispatch time:', contextRef.current.readings.length);
        dispatch({ type: 'SELECT_DISH', dishType });
      }, 100);
    } catch (error) {
      console.error('Error in handleSelectDish:', error);
    }
  }, [dispatch]);

  const handleShowLeaderboard = useCallback(() => {
    dispatch({ type: 'SHOW_LEADERBOARD' });
  }, [dispatch]);

  const handleExit = useCallback(() => {
    dispatch({ type: 'EXIT' });
  }, [dispatch]);

  const handleBack = useCallback(() => {
    dispatch({ type: 'BACK' });
  }, [dispatch]);

  const handleCancelIdle = useCallback(() => {
    dispatch({ type: 'IDLE_RESET' });
  }, [dispatch]);

  const handleSubmitInitials = useCallback(async (initials: string) => {
    if (context.currentScore !== undefined && context.currentScore !== null) {
      if (!qualifiesForLeaderboard(context.currentScore)) {
        return;
      }
      
      const entry = {
        initials: initials.toUpperCase().slice(0, 3),
        score: context.currentScore,
        netid: 'presentation',
        meal_period: mealPeriod,
        ts: Date.now(),
      };
      
      try {
        // Save to localStorage only (no database)
        const updatedLeaderboard = addLeaderboardEntry(entry);
        saveLeaderboard(updatedLeaderboard);
        // Convert to database format for context
        const dbFormatLeaderboard: LeaderboardEntry[] = updatedLeaderboard.map((e, index) => {
          // Safely handle timestamp
          let timestamp = e.ts;
          if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
            timestamp = Date.now();
          }
          const date = new Date(timestamp);
          const validDate = isNaN(date.getTime()) ? new Date() : date;
          
          return {
            id: index + 1, // Use numeric ID for compatibility
            initials: e.initials,
            score: e.score,
            netid: e.netId || 'presentation',
            meal_period: (e.mealPeriod || mealPeriod) as 'breakfast' | 'lunch' | 'dinner' | 'other',
            created_at: validDate.toISOString(),
          };
        });
        setContext(prev => ({ ...prev, leaderboard: dbFormatLeaderboard }));
      } catch (error) {
        console.error('Failed to add to leaderboard:', error);
        // Still update UI even if save fails
        const updatedLeaderboard = [...context.leaderboard, {
          id: (context.leaderboard.length + 1),
          initials: entry.initials,
          score: entry.score,
          netid: 'presentation',
          meal_period: mealPeriod,
          created_at: new Date().toISOString(),
        }]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        setContext(prev => ({ ...prev, leaderboard: updatedLeaderboard }));
      }
    }
  }, [context.currentScore, context.leaderboard, mealPeriod]);

  const handleDebugWeightChange = useCallback((weight: number | null) => {
    setDebugWeightOverride(weight);
    dispatch({ type: 'SET_DEBUG_WEIGHT', weight });
  }, [dispatch]);

  // Render current screen
  const renderScreen = () => {
    switch (state) {
      case 'DISH_TYPE':
        return (
          <ScreenDishType 
            key="dish-type" 
            onSelectDish={handleSelectDish} 
            onBack={handleBack} 
          />
        );
      
      case 'SCORE':
        return (
          <ScreenScore
            score={context.currentScore || 0}
            previousScore={context.previousScore}
            netId={context.netId}
            mealPeriod={mealPeriod}
            onShowLeaderboard={handleShowLeaderboard}
            onExit={handleExit}
            onBack={handleBack}
          />
        );
      
      case 'LEADERBOARD':
        return (
          <ScreenLeaderboard
            leaderboard={context.leaderboard}
            currentScore={context.currentScore || 0}
            onSubmitInitials={handleSubmitInitials}
            onExit={handleExit}
            onBack={handleBack}
          />
        );
      
      default:
        return <ScreenDishType onSelectDish={handleSelectDish} onBack={handleBack} />;
    }
  };

  const isConnected = transport.isConnected();
  const [showConnectPrompt, setShowConnectPrompt] = React.useState(false);

  // Show connect prompt if not connected after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!transport.isConnected()) {
        setShowConnectPrompt(true);
      }
    }, 2000); // Show after 2 seconds if not connected

    return () => clearTimeout(timer);
  }, [transport]);

  const handleConnect = async () => {
    try {
      await transport.connect();
      setShowConnectPrompt(false);
    } catch (error) {
      console.error('Failed to connect scale:', error);
    }
  };

  return (
    <div className="relative">
      {/* Dev Mode Indicator */}
      {devMode && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-600 text-black px-4 py-2 rounded-lg font-semibold shadow-lg">
          DEV MODE ACTIVE (Ctrl+Shift+D to toggle)
        </div>
      )}
      
      {/* Connect Scale Prompt */}
      {showConnectPrompt && !isConnected && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Scale</h2>
          <p className="text-gray-300 mb-4">Click the button below to connect your scale</p>
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Connect Scale
          </button>
          <button
            onClick={() => setShowConnectPrompt(false)}
            className="ml-4 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
          >
            Skip
          </button>
        </div>
      )}
      
      <StatusBar 
        transport={transport} 
        mealPeriod={getMealPeriodWithTime(mealPeriod)} 
        idleCountdown={context.idleCountdown}
        leaderboard={context.leaderboard}
        currentWeight={context.readings[context.readings.length - 1]?.grams || 0}
        isStable={context.readings[context.readings.length - 1]?.stable || false}
        onDebugWeightChange={handleDebugWeightChange}
      />

      {/* Main content */}
      <div className="min-h-screen">
        {renderScreen()}
      </div>

      {/* Idle warning modal overlay */}
      {context.showIdleWarning && (
        <div className="idle-modal-overlay fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
          <ScreenIdle countdown={context.idleCountdown} onCancel={handleCancelIdle} />
        </div>
      )}

      {/* Developer Mode Panel */}
      <DevModePanel
        isOpen={devMode}
        onClose={() => setDevMode(false)}
        onSendReading={handleSendReading}
        onSetWeight={handleSetWeight}
        currentState={state}
        currentWeight={context.readings?.[context.readings.length - 1]?.grams || 0}
        isStable={gateStable(context.readings)}
      />
    </div>
  );
}

