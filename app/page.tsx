'use client';

import React, { useEffect, useCallback } from 'react';
import { MockScale } from '../transport/transport.mock';
import { ScaleTransport } from '../transport/transport';
import { 
  AppState, 
  AppEvent, 
  AppContext, 
  appReducer, 
  applyActions, 
  getInitialContext 
} from '../lib/state';
import { 
  calculateDishScore, 
  gateStable, 
  DishType 
} from '../lib/fws';
import { 
  getCurrentMealPeriod, 
  getMealPeriodWithTime,
  saveScoreToAPI
} from '../lib/meal-api';
import { 
  loadLeaderboardFromAPI, 
  addLeaderboardEntryToAPI, 
  qualifiesForLeaderboard, 
  type LeaderboardEntry 
} from '../lib/leaderboard-api';

// Components
import ScreenWelcome from '../components/ScreenWelcome';
import ScreenDishType from '../components/ScreenDishType';
import ScreenScore from '../components/ScreenScore';
import ScreenLeaderboard from '../components/ScreenLeaderboard';
import ScreenIdle from '../components/ScreenIdle';
import ScreenError from '../components/ScreenError';
import StatusBar from '../components/StatusBar';

export default function FoodWasteScoreApp() {
  const [state, setState] = React.useState<AppState>('WELCOME');
  const [context, setContext] = React.useState<AppContext>(() => ({
    ...getInitialContext(),
    leaderboard: [],
  }));
  
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
  
  const [transport] = React.useState<ScaleTransport>(() => new MockScale());
  const [mealPeriod] = React.useState(() => getCurrentMealPeriod());

  // Dispatch function for state machine
  const dispatch = useCallback((event: AppEvent) => {
    const result = appReducer(stateRef.current, contextRef.current, event);
    setState(result.state);
    setContext(applyActions(result.context, result.actions));
  }, []);

  // Handle scale readings
  useEffect(() => {
    const handleReading = (reading: any) => {
      dispatch({ type: 'READING_UPDATE', reading });
      
      // Check if we should transition to SCORE state
      // Only transition if we're in DISH_TYPE state AND have a dish type selected AND readings are stable
      if (stateRef.current === 'DISH_TYPE' && contextRef.current.dishType && contextRef.current.readings.length > 0) {
        const isStable = gateStable([...contextRef.current.readings, reading]);
        if (isStable) {
          const score = calculateDishScore(reading.grams, contextRef.current.dishType);
          console.log('=== SCORE CALCULATED ===');
          console.log('Raw weight:', reading.grams, 'grams');
          console.log('Dish type:', contextRef.current.dishType);
          console.log('Calculated score:', score);
          console.log('Attempting to submit score to database...');
          
          dispatch({ type: 'SET_SCORE', score } as any);
          setState('SCORE');
        }
      }
    };

    transport.onReading(handleReading);
    
    // Connect transport on mount
    transport.connect().catch((error) => {
      dispatch({ type: 'ERROR_OCCURRED', error: error.message });
    });

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

  // Test idle timer functionality
  useEffect(() => {
    const handleTestIdle = () => {
      setContext(prev => ({ ...prev, idleCountdown: 0 }));
    };

    const handleForceIdle = () => {
      setContext(prev => ({ ...prev, idleCountdown: 0 }));
    };

    window.addEventListener('testIdle', handleTestIdle);
    window.addEventListener('forceIdle', handleForceIdle);
    return () => {
      window.removeEventListener('testIdle', handleTestIdle);
      window.removeEventListener('forceIdle', handleForceIdle);
    };
  }, []);

  // Reset inactivity timer on user interaction
  useEffect(() => {
    const handleUserActivity = () => {
      if (stateRef.current !== 'IDLE_WARNING' && stateRef.current !== 'ERROR') {
        setContext(prev => ({ ...prev, idleCountdown: 25 }));
      }
    };

    // Only reset on actual user interactions, not scale readings
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

  // Load leaderboard on mount
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const entries = await loadLeaderboardFromAPI();
        dispatch({ type: 'SET_LEADERBOARD', payload: entries });
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      }
    };
    loadLeaderboard();
  }, []);

  // Event handlers
  const handleSubmitNetId = useCallback((netId: string) => {
    dispatch({ type: 'SUBMIT_NETID', netId });
  }, [dispatch]);

  const handleSelectDish = useCallback((dishType: DishType) => {
    dispatch({ type: 'SELECT_DISH', dishType });
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
    if (context.currentScore && context.netId) {
      // Check if score qualifies for leaderboard (minimum 50 points)
      if (!qualifiesForLeaderboard(context.currentScore)) {
        return;
      }
      
      const entry: Omit<LeaderboardEntry, 'id' | 'created_at'> = {
        initials: initials.toUpperCase().slice(0, 3), // Ensure 3 chars max, uppercase
        score: context.currentScore,
        netid: context.netId, // Store for user tracking
        meal_period: mealPeriod, // Track which meal this was for
      };
      
      try {
        console.log('=== ATTEMPTING TO SUBMIT TO DATABASE ===');
        console.log('Leaderboard entry:', entry);
        console.log('User score data:', {
          netId: context.netId,
          mealPeriod: mealPeriod,
          score: context.currentScore,
          dishType: context.dishType,
          weightGrams: context.stableReadings?.[context.stableReadings.length - 1]?.grams || 0
        });
        
        // Add to leaderboard using the database API
        const updatedLeaderboard = await addLeaderboardEntryToAPI(entry);
        console.log('Successfully added to leaderboard:', updatedLeaderboard);
        
        // Update context
        setContext(prev => ({ ...prev, leaderboard: updatedLeaderboard }));
        
        // Save user's score for this meal period to database
        await saveScoreToAPI(
          context.netId, 
          mealPeriod, 
          context.currentScore,
          context.dishType || 'plate',
          context.stableReadings?.[context.stableReadings.length - 1]?.grams || 0
        );
        console.log('Successfully saved user score');
        
      } catch (error) {
        console.error('Failed to save to database:', error);
        // Still update UI even if database fails
        const updatedLeaderboard = [...context.leaderboard, entry as LeaderboardEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        setContext(prev => ({ ...prev, leaderboard: updatedLeaderboard }));
      }
    }
  }, [context.currentScore, context.netId, mealPeriod]);

  // Generate comparison text for score screen
  const getComparisonText = useCallback(() => {
    if (!context.netId || !context.currentScore) return '';
    
    // For now, use simple comparison since we can't await in useCallback
    // In a real app, you'd want to load this data when the score is calculated
    return `Thanks for checking in!`;
  }, [context.netId, context.currentScore, mealPeriod]);

  // Render current screen
  const renderScreen = () => {
    switch (state) {
      case 'WELCOME':
        return <ScreenWelcome onSubmitNetId={handleSubmitNetId} />;
      
      case 'DISH_TYPE':
        return <ScreenDishType onSelectDish={handleSelectDish} onBack={handleBack} />;
      
      case 'SCORE':
        return (
          <ScreenScore
            score={context.currentScore || 0}
            comparisonText={getComparisonText()}
            onShowLeaderboard={handleShowLeaderboard}
            onExit={handleExit}
            onBack={handleBack}
          />
        );
      
      case 'LEADERBOARD':
        return (
          <ScreenLeaderboard
            leaderboard={context.leaderboard}
            onSubmitInitials={handleSubmitInitials}
            onExit={handleExit}
            onBack={handleBack}
          />
        );
      
      case 'IDLE_WARNING':
        return <ScreenIdle countdown={context.idleCountdown} onCancel={handleCancelIdle} />;
      
      case 'ERROR':
        return <ScreenError onExit={handleExit} />;
      
      default:
        return <ScreenWelcome onSubmitNetId={handleSubmitNetId} />;
    }
  };

  return (
    <div className="relative">
      <StatusBar 
        transport={transport} 
        mealPeriod={getMealPeriodWithTime(mealPeriod)} 
        idleCountdown={context.idleCountdown}
        leaderboard={context.leaderboard}
      />
      {renderScreen()}
    </div>
  );
}
