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
  const [debugWeightOverride, setDebugWeightOverride] = React.useState<number | null>(null);
  
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
    // Only log non-IDLE_TICK events to reduce spam
    if (event.type !== 'IDLE_TICK') {
      console.log('=== STATE TRANSITION ===');
      console.log('Event:', event.type);
      console.log('From state:', stateRef.current);
      console.log('Context before:', {
        netId: contextRef.current.netId,
        dishType: contextRef.current.dishType,
        currentScore: contextRef.current.currentScore,
        idleCountdown: contextRef.current.idleCountdown,
        showIdleWarning: contextRef.current.showIdleWarning
      });
    } else {
      // Log idle tick every 5 seconds to reduce spam
      if (contextRef.current.idleCountdown % 5 === 0) {
        console.log('⏰ Idle tick:', contextRef.current.idleCountdown, 'seconds remaining, showIdleWarning:', contextRef.current.showIdleWarning);
      }
    }
    
    const result = appReducer(stateRef.current, contextRef.current, event);
    console.log('To state:', result.state);
    console.log('Actions:', result.actions.map(a => a.type));
    
    setState(result.state);
    const newContext = applyActions(result.context, result.actions);
    setContext(newContext);
    
    // Handle database save action
    const saveScoreAction = result.actions.find(a => a.type === 'SAVE_SCORE_TO_DB');
    if (saveScoreAction && saveScoreAction.type === 'SAVE_SCORE_TO_DB') {
      console.log('=== SAVING SCORE TO DATABASE ===');
      console.log('NetID:', saveScoreAction.netId);
      console.log('Dish Type:', saveScoreAction.dishType);
      console.log('Score:', saveScoreAction.score);
      console.log('Weight:', saveScoreAction.weightGrams, 'grams');
      
      // Save to database asynchronously
      saveScoreToAPI(saveScoreAction.netId, mealPeriod, saveScoreAction.score, saveScoreAction.dishType, saveScoreAction.weightGrams)
        .then(() => {
          console.log('Score saved to database successfully');
        })
        .catch((error) => {
          console.error('Failed to save score to database:', error);
        });
    }
  }, []);

  // Handle scale readings
  useEffect(() => {
    const handleReading = (reading: any) => {
      dispatch({ type: 'READING_UPDATE', reading });
      
      // Debug logging
      console.log('=== READING UPDATE DEBUG ===');
      console.log('Current state:', stateRef.current);
      console.log('Dish type:', contextRef.current.dishType);
      console.log('Readings count:', contextRef.current.readings.length);
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
      console.log('Test idle triggered - setting countdown to 0');
      setContext(prev => ({ ...prev, idleCountdown: 0 }));
    };

    const handleForceIdle = () => {
      console.log('Force idle triggered - showing idle warning');
      setContext(prev => ({ ...prev, showIdleWarning: true, idleCountdown: 5 }));
    };

    window.addEventListener('testIdle', handleTestIdle);
    window.addEventListener('forceIdle', handleForceIdle);
    
    // Add console commands for testing
    (window as any).testIdle = () => {
      console.log('Testing idle timer...');
      setContext(prev => ({ ...prev, idleCountdown: 0 }));
    };
    
    (window as any).forceIdle = () => {
      console.log('Forcing idle warning...');
      setContext(prev => ({ ...prev, showIdleWarning: true, idleCountdown: 5 }));
    };
    
    (window as any).testLeaderboard = async () => {
      console.log('Testing leaderboard submission...');
      try {
        const testEntry = {
          initials: 'TES',
          score: 85,
          netid: 'testuser',
          meal_period: 'other' as const
        };
        console.log('Submitting test entry:', testEntry);
        const result = await addLeaderboardEntryToAPI(testEntry);
        console.log('  Test submission result:', result);
      } catch (error) {
        console.error('  Test submission failed:', error);
      }
    };
    
    (window as any).checkLeaderboard = async () => {
      console.log('🔍 Checking current leaderboard...');
      try {
        const response = await fetch('/api/leaderboard?limit=50');
        const entries = await response.json();
        console.log('🔍 Current leaderboard entries:', entries);
        console.log('🔍 Total entries:', entries.length);
        console.log('🔍 Scores:', entries.map((e: any) => `${e.initials}: ${e.score}%`));
      } catch (error) {
        console.error('🔍 Failed to check leaderboard:', error);
      }
    };
    
    return () => {
      window.removeEventListener('testIdle', handleTestIdle);
      window.removeEventListener('forceIdle', handleForceIdle);
      delete (window as any).testIdle;
      delete (window as any).forceIdle;
      delete (window as any).testLeaderboard;
      delete (window as any).checkLeaderboard;
    };
  }, []);

  // Reset inactivity timer on user interaction
  useEffect(() => {
    const handleUserActivity = (e: Event) => {
      // Don't reset if clicking on the idle modal overlay
      if (e.target && (e.target as Element).closest('.idle-modal-overlay')) {
        return;
      }
      
      if (stateRef.current !== 'ERROR') {
        setContext(prev => ({ 
          ...prev, 
          idleCountdown: 25,
          showIdleWarning: false // Hide idle warning on any user activity
        }));
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
        console.log('🔄 Loading leaderboard on mount...');
        // Temporarily increase limit to see all entries
        const entries = await loadLeaderboardFromAPI();
        console.log('📊 Loaded leaderboard entries:', entries);
        console.log('📊 Total entries found:', entries.length);
        dispatch({ type: 'SET_LEADERBOARD', payload: entries });
      } catch (error) {
        console.error('❌ Failed to load leaderboard:', error);
      }
    };
    loadLeaderboard();
  }, []);

  // Event handlers
  const handleSubmitNetId = useCallback(async (netId: string) => {
    dispatch({ type: 'SUBMIT_NETID', netId });
    
    // Fetch previous score for comparison
    try {
      console.log('🔍 Fetching previous score for NetID:', netId);
      const response = await fetch(`/api/scores?netid=${netId}&meal_period=${mealPeriod}`);
      if (response.ok) {
        const data = await response.json();
        const previousScore = data?.score || null;
        console.log('🔍 Previous score found:', previousScore);
        dispatch({ type: 'SET_PREVIOUS_SCORE', score: previousScore });
      } else {
        console.log('🔍 No previous score found for NetID:', netId);
        dispatch({ type: 'SET_PREVIOUS_SCORE', score: null });
      }
    } catch (error) {
      console.error('❌ Failed to fetch previous score:', error);
      dispatch({ type: 'SET_PREVIOUS_SCORE', score: null });
    }
  }, [dispatch, mealPeriod]);

  const handleSelectDish = useCallback((dishType: DishType) => {
    console.log('=== DISH SELECTED ===');
    console.log('Selected dish type:', dishType);
    console.log('Current readings count:', contextRef.current.readings.length);
    
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
    console.log('=== SUBMIT INITIALS CALLED ===');
    console.log('Initials:', initials);
    console.log('Context check:', {
      currentScore: context.currentScore,
      netId: context.netId,
      dishType: context.dishType,
      mealPeriod: mealPeriod
    });
    
    if (context.currentScore !== undefined && context.currentScore !== null && context.netId) {
      // Check if score qualifies for leaderboard (minimum 50 points)
      console.log('Checking qualification for score:', context.currentScore);
      if (!qualifiesForLeaderboard(context.currentScore)) {
        console.log('❌ Score too low for leaderboard:', context.currentScore, '(minimum 50 required)');
        return;
      }
      console.log('✅ Score qualifies for leaderboard:', context.currentScore);
      
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
        console.log('Calling addLeaderboardEntryToAPI with entry:', entry);
        const updatedLeaderboard = await addLeaderboardEntryToAPI(entry);
        console.log('Successfully added to leaderboard:', updatedLeaderboard);
        console.log('Updated leaderboard length:', updatedLeaderboard.length);
        
        // Update context
        setContext(prev => ({ ...prev, leaderboard: updatedLeaderboard }));
        console.log('Context updated with new leaderboard');
        
        console.log('✅ Leaderboard entry added successfully');
        
      } catch (error) {
        console.error('Failed to save to database:', error);
        // Still update UI even if database fails
        const updatedLeaderboard = [...context.leaderboard, entry as LeaderboardEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        setContext(prev => ({ ...prev, leaderboard: updatedLeaderboard }));
      }
    } else {
      console.log('❌ Missing required data - cannot submit to database');
      console.log('Current score:', context.currentScore, '(type:', typeof context.currentScore, ')');
      console.log('NetID:', context.netId, '(type:', typeof context.netId, ')');
      console.log('Score is undefined?', context.currentScore === undefined);
      console.log('Score is null?', context.currentScore === null);
      console.log('Score is falsy?', !context.currentScore);
    }
  }, [context.currentScore, context.netId, mealPeriod]);

  const handleDebugWeightChange = useCallback((weight: number) => {
    dispatch({ type: 'SET_DEBUG_WEIGHT', weight });
  }, [dispatch]);

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
        onDebugWeightChange={handleDebugWeightChange}
      />
      {renderScreen()}
      
      {/* Idle warning modal overlay */}
      {context.showIdleWarning && (
        <div className="idle-modal-overlay fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
          <ScreenIdle countdown={context.idleCountdown} onCancel={handleCancelIdle} />
        </div>
      )}
    </div>
  );
}
