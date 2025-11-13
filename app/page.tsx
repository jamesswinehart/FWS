'use client';

import React, { useEffect, useCallback } from 'react';
import { HIDScale } from '../transport/transport.hid';
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
import ScreenThankYou from '../components/ScreenThankYou';
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
  const [showConnectHelp, setShowConnectHelp] = React.useState(false);
  const [showReloadPrompt, setShowReloadPrompt] = React.useState(false);
  
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
        console.log('Idle tick:', contextRef.current.idleCountdown, 'seconds remaining, showIdleWarning:', contextRef.current.showIdleWarning);
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
    
    // Handle baseline data save action (score = 0 for baseline data)
    const saveBaselineAction = result.actions.find(a => a.type === 'SAVE_BASELINE_DATA');
    if (saveBaselineAction && saveBaselineAction.type === 'SAVE_BASELINE_DATA') {
      console.log('=== SAVING BASELINE DATA TO DATABASE ===');
      console.log('NetID:', saveBaselineAction.netId);
      console.log('Dish Type:', saveBaselineAction.dishType);
      console.log('Weight:', saveBaselineAction.weightGrams, 'grams');
      
      // Save baseline data with score = 0
      saveScoreToAPI(saveBaselineAction.netId, mealPeriod, 0, saveBaselineAction.dishType, saveBaselineAction.weightGrams)
        .then(() => {
          console.log('Baseline data saved to database successfully');
        })
        .catch((error) => {
          console.error('Failed to save baseline data to database:', error);
        });
    }
  }, [mealPeriod]);

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
    
    // Do not auto-connect; WebHID requires a user gesture. Use the UI button to connect.
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


  // Auto-exit control group after thank-you (5 seconds)
  useEffect(() => {
    if (state === 'THANK_YOU' && context.treatmentGroup === 'control') {
      const t = setTimeout(() => dispatch({ type: 'EXIT' }), 5000);
      return () => clearTimeout(t);
    }
  }, [state, context.treatmentGroup, dispatch]);

  // Periodic reload prompt every 2 minutes 30 seconds
  useEffect(() => {
    // Start/restart the timer only when the prompt is hidden
    if (!showReloadPrompt) {
      const t = setTimeout(() => setShowReloadPrompt(true), 2.5 * 60 * 1000);
      return () => clearTimeout(t);
    }
  }, [showReloadPrompt]);

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
      console.log('Checking current leaderboard...');
      try {
        const response = await fetch('/api/leaderboard?limit=50');
        const entries = await response.json();
        console.log('Current leaderboard entries:', entries);
        console.log('Total entries:', entries.length);
        console.log('Scores:', entries.map((e: any) => `${e.initials}: ${e.score}%`));
      } catch (error) {
        console.error('Failed to check leaderboard:', error);
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
        console.log('Loading leaderboard on mount...');
        // Temporarily increase limit to see all entries
        const entries = await loadLeaderboardFromAPI();
        console.log('Loaded leaderboard entries:', entries);
        console.log('Total entries found:', entries.length);
        dispatch({ type: 'SET_LEADERBOARD', payload: entries });
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      }
    };
    loadLeaderboard();
  }, []);

  // Event handlers
  const handleSubmitNetId = useCallback(async (netId: string) => {
    // First validate the NetID
    try {
      console.log('Validating NetID:', netId);
      const validateResponse = await fetch('/api/auth/validate-netid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ netid: netId }),
      });

      if (!validateResponse.ok) {
        throw new Error('Failed to validate NetID');
      }

      const validateData = await validateResponse.json();
      const isValid = validateData.allowed;

      console.log('NetID validation result:', isValid);

      // Dispatch validation result
      dispatch({ type: 'NETID_VALIDATED', netId: netId.trim(), isValid });
    
      // Only proceed if NetID is valid
      if (isValid) {
    // Fetch previous score for comparison
    try {
      console.log('Fetching previous score for NetID:', netId);
      const response = await fetch(`/api/scores?netid=${netId}&meal_period=${mealPeriod}`);
      if (response.ok) {
        const data = await response.json();
        const previousScore = data?.score || null;
        console.log('Previous score found:', previousScore);
        dispatch({ type: 'SET_PREVIOUS_SCORE', score: previousScore });
      } else {
        console.log('No previous score found for NetID:', netId);
        dispatch({ type: 'SET_PREVIOUS_SCORE', score: null });
      }
    } catch (error) {
      console.error('Failed to fetch previous score:', error);
      dispatch({ type: 'SET_PREVIOUS_SCORE', score: null });
        }
      }
    } catch (error) {
      console.error('Failed to validate NetID:', error);
      // On error, show error message
      dispatch({ 
        type: 'NETID_VALIDATED', 
        netId: netId.trim(), 
        isValid: false 
      });
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
        console.log('Score does not qualify for leaderboard:', context.currentScore);
        return;
      }
      console.log('Score qualifies for leaderboard:', context.currentScore);
      
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
        
        // Save score to database immediately after leaderboard submission
        if (context.dishType && context.readings.length > 0 && !context.scoreSaved) {
          const latestReading = context.readings[context.readings.length - 1];
          console.log('=== SAVING SCORE TO DATABASE AFTER LEADERBOARD SUBMISSION ===');
          console.log('NetID:', context.netId);
          console.log('Dish Type:', context.dishType);
          console.log('Score:', context.currentScore);
          console.log('Weight:', latestReading?.grams || 0, 'grams');
          
          try {
            await saveScoreToAPI(
              context.netId!,
              mealPeriod,
              context.currentScore!,
              context.dishType,
              latestReading?.grams || 0
            );
            console.log('Score saved to database successfully');
            // Mark score as saved to prevent duplicate saves on exit
            setContext(prev => ({ ...prev, scoreSaved: true }));
          } catch (error) {
            console.error('Failed to save score to database:', error);
            // Don't throw - leaderboard submission succeeded even if score save failed
          }
        }
        
        // Update context
        setContext(prev => ({ ...prev, leaderboard: updatedLeaderboard }));
        console.log('Context updated with new leaderboard');
        
        console.log('Leaderboard entry added successfully');
        
      } catch (error) {
        console.error('Failed to save to database:', error);
        // Still update UI even if database fails
        const updatedLeaderboard = [...context.leaderboard, entry as LeaderboardEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        setContext(prev => ({ ...prev, leaderboard: updatedLeaderboard }));
      }
    } else {
      console.log('Missing required data - cannot submit to database');
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
        // Consider weight ready only if readings are stable AND latest stable reading is > 0g
        // Use rolling stability gate and the latest reading's grams to avoid relying on device 'stable' flag
        const latestReading = context.readings?.[context.readings.length - 1];
        const hasStableNonzero = gateStable(context.readings) && (latestReading?.grams || 0) > 0;
        return (
          <ScreenWelcome 
            onSubmitNetId={handleSubmitNetId}
            isWeightStable={hasStableNonzero}
          />
        );
      
      case 'DISH_TYPE':
        return <ScreenDishType onSelectDish={handleSelectDish} onBack={handleBack} />;
      
      case 'THANK_YOU':
        return (
          <ScreenThankYou onExit={handleExit} />
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
      
      case 'ERROR':
        return <ScreenError errorMessage={context.errorMessage} onExit={handleExit} />;
      
      default:
        return <ScreenWelcome onSubmitNetId={handleSubmitNetId} />;
    }
  };

  const isConnected = transport.isConnected();

  return (
    <div className="relative">
      <StatusBar 
        transport={transport} 
        mealPeriod={getMealPeriodWithTime(mealPeriod)} 
        idleCountdown={context.idleCountdown}
        leaderboard={context.leaderboard}
        currentWeight={context.readings[context.readings.length - 1]?.grams || 0}
        isStable={context.readings[context.readings.length - 1]?.stable || false}
        onDebugWeightChange={handleDebugWeightChange}
      />
      <div className={isConnected ? '' : 'filter blur-sm pointer-events-none select-none'}>
      {renderScreen()}
      </div>
      {!isConnected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" />
          {/* Center modal (hidden on md+ once help shows) */}
          {showConnectHelp ? (
            <div className="relative z-50 text-center p-8 bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl border border-gray-700 md:hidden">
              <h2 className="text-3xl font-bold text-white mb-4">Connect the scale to continue</h2>
              <p className="text-gray-300 mb-6">Make sure your USB scale is plugged in and permitted by the browser.</p>
              <button
                onClick={() => {
                  setShowConnectHelp(true);
                  transport.connect().catch(console.error);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors animate-pulse"
              >
                Connect Scale
              </button>
            </div>
          ) : (
            <div className="relative z-50 text-center p-8 bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-4">Connect the scale to continue</h2>
              <p className="text-gray-300 mb-6">Make sure your USB scale is plugged in and permitted by the browser.</p>
              <button
                onClick={() => {
                  setShowConnectHelp(true);
                  transport.connect().catch(console.error);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors animate-pulse"
              >
                Connect Scale
              </button>
            </div>
          )}
          {/* Instruction helper panel (only after user clicks connect) */}
          {showConnectHelp && (
            <div className="hidden md:block absolute top-20 left-[28rem] lg:left-[34rem] xl:left-[40rem] z-50">
              <div className="bg-gray-900/95 text-white rounded-lg shadow-xl border border-gray-700 max-w-xl">
                <div className="px-5 py-4 text-left">
                  <ul className="list-disc list-inside space-y-2 text-sm md:text-base">
                    <li className="whitespace-nowrap">Make sure the scale is turned on</li>
                    <li className="whitespace-nowrap">Click on “M10 10 lb Digital Postal Scale”</li>
                    <li className="whitespace-nowrap">Click “Connect” in the browser popup</li>
                    <li className="whitespace-nowrap">If the browser popup disppears, try refreshing the page</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reload reminder overlay (shows when connected) */}
      {isConnected && showReloadPrompt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" />
          <div className="relative z-50 text-center p-8 bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl border border-gray-700 max-w-xl">
            <h2 className="text-3xl font-bold text-white mb-4">Please reload the page</h2>
            <p className="text-gray-300 mb-6">For best performance, reload this kiosk page periodically.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
              >
                Reload Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Idle warning modal overlay */}
      {context.showIdleWarning && (
        <div className="idle-modal-overlay fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
          <ScreenIdle countdown={context.idleCountdown} onCancel={handleCancelIdle} />
        </div>
      )}
    </div>
  );
}
