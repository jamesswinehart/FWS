import { ScaleReading } from '../transport/transport';
import { calculateDishScore } from './fws';
import { LeaderboardEntry } from './supabase';

export type DishType = 'plate' | 'salad' | 'cereal';

export type AppState = 
  | 'WELCOME'
  | 'DISH_TYPE'
  | 'THANK_YOU'
  | 'SCORE'
  | 'LEADERBOARD'
  | 'ERROR';

export type AppEvent = 
  | { type: 'SUBMIT_NETID'; netId: string }
  | { type: 'NETID_VALIDATED'; netId: string; isValid: boolean }
  | { type: 'SELECT_DISH'; dishType: DishType }
  | { type: 'READING_UPDATE'; reading: ScaleReading }
  | { type: 'SHOW_LEADERBOARD' }
  | { type: 'EXIT' }
  | { type: 'BACK' }
  | { type: 'IDLE_TICK' }
  | { type: 'IDLE_RESET' }
  | { type: 'ERROR_OCCURRED'; error: string }
  | { type: 'SET_LEADERBOARD'; payload: any[] }
  | { type: 'SET_PREVIOUS_SCORE'; score: number | null }
  | { type: 'SET_DEBUG_WEIGHT'; weight: number | null };

export interface AppContext {
  // Session data
  netId?: string;
  dishType?: DishType;
  currentScore?: number;
  previousScore?: number; // Store user's previous score for comparison
  readings: ScaleReading[];
  stableReadings: ScaleReading[];
  
  // UI state
  idleCountdown: number;
  errorMessage?: string;
  previousState?: AppState; // Track state before idle warning
  showIdleWarning: boolean; // Flag to show idle modal overlay
  scoreSaved: boolean; // Flag to prevent duplicate score saves
  
  // Debug
  debugWeightOverride?: number; // Debug override for net weight
  
  // Leaderboard
  leaderboard: LeaderboardEntry[];
}

export type AppAction = 
  | { type: 'SET_STATE'; state: AppState }
  | { type: 'SET_NETID'; netId: string }
  | { type: 'SET_DISH_TYPE'; dishType: DishType }
  | { type: 'ADD_READING'; reading: ScaleReading }
  | { type: 'SET_SCORE'; score: number }
  | { type: 'SET_PREVIOUS_SCORE'; score: number | null }
  | { type: 'SET_DEBUG_WEIGHT'; weight: number | null }
  | { type: 'SAVE_SCORE_TO_DB'; netId: string; dishType: DishType; score: number; weightGrams: number }
  | { type: 'SAVE_BASELINE_DATA'; netId: string; dishType: DishType; weightGrams: number }
  | { type: 'SET_SCORE_SAVED'; saved: boolean }
  | { type: 'SET_IDLE_COUNTDOWN'; countdown: number }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_SESSION' }
  | { type: 'CLEAR_DISH_DATA' }
  | { type: 'SET_PREVIOUS_STATE'; state: AppState }
  | { type: 'SHOW_IDLE_WARNING' }
  | { type: 'HIDE_IDLE_WARNING' }
  | { type: 'UPDATE_LEADERBOARD'; entry: LeaderboardEntry }
  | { type: 'SET_LEADERBOARD_DATA'; entries: any[] };

export function appReducer(state: AppState, context: AppContext, event: AppEvent): {
  state: AppState;
  context: AppContext;
  actions: AppAction[];
} {
  const actions: AppAction[] = [];
  let newState = state;
  const newContext = { ...context };

  switch (state) {
    case 'WELCOME':
      if (event.type === 'NETID_VALIDATED') {
        if (event.isValid) {
        newState = 'DISH_TYPE';
        actions.push({ type: 'SET_NETID', netId: event.netId });
        } else {
          // Invalid NetID - show error and stay on welcome screen
          actions.push({ type: 'SET_ERROR', error: `NetID "${event.netId}" is not authorized. Please contact an administrator.` });
          newState = 'ERROR';
        }
      }
      break;

    case 'DISH_TYPE':
      if (event.type === 'SELECT_DISH') {
        newState = 'THANK_YOU';
        actions.push({ type: 'SET_DISH_TYPE', dishType: event.dishType });
        // Save baseline data (netid, dishType, weightGrams) without score
        if (context.netId && context.readings.length > 0) {
          const latestReading = context.readings[context.readings.length - 1];
          actions.push({ 
            type: 'SAVE_BASELINE_DATA', 
            netId: context.netId, 
            dishType: event.dishType, 
            weightGrams: latestReading?.grams || 0 
          });
        }
      } else if (event.type === 'BACK') {
        newState = 'WELCOME';
        actions.push({ type: 'RESET_SESSION' });
      }
      break;

    case 'THANK_YOU':
      if (event.type === 'BACK' || event.type === 'EXIT') {
        newState = 'WELCOME';
        actions.push({ type: 'RESET_SESSION' });
      }
      break;

    case 'SCORE':
      if (event.type === 'SHOW_LEADERBOARD') {
        newState = 'LEADERBOARD';
        // Don't save score when going to leaderboard - wait for exit
      } else if (event.type === 'EXIT') {
        newState = 'WELCOME';
        actions.push({ type: 'RESET_SESSION' });
      } else if (event.type === 'BACK') {
        newState = 'DISH_TYPE';
        actions.push({ type: 'CLEAR_DISH_DATA' });
      }
      // Update score when new readings come in (especially if stable)
      if (event.type === 'READING_UPDATE' && context.dishType) {
        // Use the new reading from the event (it will be added to context by the global handler)
        const newScore = calculateDishScore(event.reading.grams, context.dishType, context.debugWeightOverride);
        actions.push({ type: 'SET_SCORE', score: newScore });
      }
      break;

    case 'LEADERBOARD':
      if (event.type === 'EXIT') {
        newState = 'WELCOME';
        actions.push({ type: 'RESET_SESSION' });
      } else if (event.type === 'BACK') {
        newState = 'SCORE';
      }
      break;


    case 'ERROR':
      if (event.type === 'EXIT') {
        newState = 'WELCOME';
        actions.push({ type: 'CLEAR_ERROR' });
        actions.push({ type: 'RESET_SESSION' });
      }
      break;
  }

  // Handle global events
  if (event.type === 'ERROR_OCCURRED') {
    newState = 'ERROR';
    actions.push({ type: 'SET_ERROR', error: event.error });
  } else if (event.type === 'SET_LEADERBOARD') {
    actions.push({ type: 'SET_LEADERBOARD_DATA', entries: event.payload });
  } else if (event.type === 'SET_PREVIOUS_SCORE') {
    actions.push({ type: 'SET_PREVIOUS_SCORE', score: event.score });
  } else if (event.type === 'SET_DEBUG_WEIGHT') {
    actions.push({ type: 'SET_DEBUG_WEIGHT', weight: event.weight });
  } else if (event.type === 'IDLE_TICK' && state !== 'WELCOME' && state !== 'ERROR') {
    // Start idle warning after 25 seconds of inactivity (only in interactive states)
    if (context.idleCountdown <= 0 && !context.showIdleWarning) {
      // Don't change state, just show the modal overlay
      actions.push({ type: 'SHOW_IDLE_WARNING' });
      actions.push({ type: 'SET_IDLE_COUNTDOWN', countdown: 5 });
    } else if (context.showIdleWarning) {
      // Handle countdown when warning is already showing
      if (context.idleCountdown <= 1) {
        newState = 'WELCOME';
        actions.push({ type: 'RESET_SESSION' });
        actions.push({ type: 'HIDE_IDLE_WARNING' });
      } else {
        actions.push({ type: 'SET_IDLE_COUNTDOWN', countdown: context.idleCountdown - 1 });
      }
    } else {
      actions.push({ type: 'SET_IDLE_COUNTDOWN', countdown: context.idleCountdown - 1 });
    }
  } else if (event.type === 'IDLE_RESET') {
    // Hide the idle warning modal and reset countdown
    actions.push({ type: 'HIDE_IDLE_WARNING' });
    actions.push({ type: 'SET_IDLE_COUNTDOWN', countdown: 25 });
  }

  // Handle reading updates
  if (event.type === 'READING_UPDATE') {
    actions.push({ type: 'ADD_READING', reading: event.reading });
  }

  return { state: newState, context: newContext, actions };
}

export function applyActions(context: AppContext, actions: AppAction[]): AppContext {
  const newContext = { ...context };

  for (const action of actions) {
    switch (action.type) {
      case 'SET_NETID':
        console.log('=== SET_NETID ACTION ===');
        console.log('Setting netId to:', action.netId);
        console.log('Previous context:', newContext);
        newContext.netId = action.netId;
        console.log('New context after SET_NETID:', newContext);
        break;
      case 'SET_DISH_TYPE':
        console.log('=== SET_DISH_TYPE ACTION ===');
        console.log('Setting dishType to:', action.dishType);
        console.log('Previous context:', newContext);
        newContext.dishType = action.dishType;
        console.log('New context after SET_DISH_TYPE:', newContext);
        break;
      case 'ADD_READING':
        newContext.readings = [...newContext.readings.slice(-50), action.reading]; // Keep last 50 readings
        if (action.reading.stable) {
          newContext.stableReadings = [...newContext.stableReadings.slice(-10), action.reading]; // Keep last 10 stable readings
        }
        break;
      case 'SET_SCORE':
        console.log('=== SET_SCORE ACTION ===');
        console.log('Setting score to:', action.score);
        console.log('Previous context:', newContext);
        newContext.currentScore = action.score;
        console.log('New context after SET_SCORE:', newContext);
        break;
      case 'SAVE_SCORE_TO_DB':
        console.log('=== SAVE_SCORE_TO_DB ACTION ===');
        console.log('Database save action triggered - handled in main component');
        // This action is handled asynchronously in the main component
        break;
      case 'SET_IDLE_COUNTDOWN':
        newContext.idleCountdown = action.countdown;
        break;
      case 'SET_ERROR':
        newContext.errorMessage = action.error;
        break;
      case 'CLEAR_ERROR':
        newContext.errorMessage = undefined;
        break;
      case 'RESET_SESSION':
        console.log('=== RESET_SESSION ACTION ===');
        console.log('WARNING: Resetting all session data!');
        console.log('Previous context:', newContext);
        newContext.netId = undefined;
        newContext.dishType = undefined;
        newContext.currentScore = undefined;
        newContext.previousScore = undefined; // Reset previous score
        newContext.readings = [];
        newContext.stableReadings = [];
        newContext.scoreSaved = false; // Reset score saved flag
        newContext.debugWeightOverride = undefined; // Reset debug weight
        newContext.idleCountdown = 25; // Reset to 25 seconds
        console.log('New context after RESET_SESSION:', newContext);
        break;
      case 'CLEAR_DISH_DATA':
        console.log('=== CLEAR_DISH_DATA ACTION ===');
        console.log('WARNING: Clearing dish data!');
        console.log('Previous context:', newContext);
        newContext.dishType = undefined;
        newContext.currentScore = undefined;
        newContext.readings = [];
        newContext.stableReadings = [];
        newContext.scoreSaved = false; // Reset score saved flag
        console.log('New context after CLEAR_DISH_DATA:', newContext);
        break;
    case 'SET_PREVIOUS_STATE':
      newContext.previousState = action.state;
      break;
    case 'SHOW_IDLE_WARNING':
      newContext.showIdleWarning = true;
      break;
    case 'HIDE_IDLE_WARNING':
      newContext.showIdleWarning = false;
      break;
    case 'SET_SCORE_SAVED':
      newContext.scoreSaved = action.saved;
      break;
    case 'SET_PREVIOUS_SCORE':
      newContext.previousScore = action.score || undefined;
      break;
    case 'SET_DEBUG_WEIGHT':
      newContext.debugWeightOverride = action.weight || undefined;
      break;
      case 'UPDATE_LEADERBOARD':
        const updatedLeaderboard = [...newContext.leaderboard, action.entry]
          .sort((a, b) => {
            if (a.score !== b.score) {
              return b.score - a.score;
            }
            return b.created_at && a.created_at ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : 0;
          })
          .slice(0, 10); // Keep top 10
        newContext.leaderboard = updatedLeaderboard;
        break;
      
      case 'SET_LEADERBOARD_DATA':
        newContext.leaderboard = action.entries;
        break;
    }
  }

  return newContext;
}

export function getInitialContext(): AppContext {
  return {
    netId: undefined,
    dishType: undefined,
    currentScore: 0, // Initialize to 0 instead of undefined
    previousScore: undefined, // Initialize previous score
    readings: [],
    stableReadings: [],
    idleCountdown: 25,
    showIdleWarning: false,
    scoreSaved: false, // Initialize score saved flag
    leaderboard: [],
  };
}
