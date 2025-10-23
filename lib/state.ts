import { ScaleReading } from '../transport/transport';
import { calculateDishScore } from './fws';
import { LeaderboardEntry } from './supabase';

export type DishType = 'plate' | 'salad' | 'cereal';

export type AppState = 
  | 'WELCOME'
  | 'DISH_TYPE'
  | 'SCORE'
  | 'LEADERBOARD'
  | 'IDLE_WARNING'
  | 'ERROR';

export type AppEvent = 
  | { type: 'SUBMIT_NETID'; netId: string }
  | { type: 'SELECT_DISH'; dishType: DishType }
  | { type: 'READING_UPDATE'; reading: ScaleReading }
  | { type: 'SHOW_LEADERBOARD' }
  | { type: 'EXIT' }
  | { type: 'BACK' }
  | { type: 'IDLE_TICK' }
  | { type: 'IDLE_RESET' }
  | { type: 'ERROR_OCCURRED'; error: string }
  | { type: 'SET_LEADERBOARD'; payload: any[] };

export interface AppContext {
  // Session data
  netId?: string;
  dishType?: DishType;
  currentScore?: number;
  readings: ScaleReading[];
  stableReadings: ScaleReading[];
  
  // UI state
  idleCountdown: number;
  errorMessage?: string;
  
  // Leaderboard
  leaderboard: LeaderboardEntry[];
}

export type AppAction = 
  | { type: 'SET_STATE'; state: AppState }
  | { type: 'SET_NETID'; netId: string }
  | { type: 'SET_DISH_TYPE'; dishType: DishType }
  | { type: 'ADD_READING'; reading: ScaleReading }
  | { type: 'SET_SCORE'; score: number }
  | { type: 'SET_IDLE_COUNTDOWN'; countdown: number }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_SESSION' }
  | { type: 'CLEAR_DISH_DATA' }
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
      if (event.type === 'SUBMIT_NETID') {
        newState = 'DISH_TYPE';
        actions.push({ type: 'SET_NETID', netId: event.netId });
        // Don't reset session - we want to keep the NetID!
        // FIXED: Removed RESET_SESSION that was clearing NetID
      }
      break;

    case 'DISH_TYPE':
      if (event.type === 'SELECT_DISH') {
        newState = 'SCORE';
        actions.push({ type: 'SET_DISH_TYPE', dishType: event.dishType });
        // Calculate score using the latest reading
        if (context.readings.length > 0) {
          const latestReading = context.readings[context.readings.length - 1];
          const score = calculateDishScore(latestReading.grams, event.dishType);
          actions.push({ type: 'SET_SCORE', score });
        }
      } else if (event.type === 'BACK') {
        newState = 'WELCOME';
        actions.push({ type: 'RESET_SESSION' });
      }
      break;

    case 'SCORE':
      if (event.type === 'SHOW_LEADERBOARD') {
        newState = 'LEADERBOARD';
      } else if (event.type === 'EXIT') {
        newState = 'WELCOME';
        actions.push({ type: 'RESET_SESSION' });
      } else if (event.type === 'BACK') {
        newState = 'DISH_TYPE';
        actions.push({ type: 'CLEAR_DISH_DATA' });
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

    case 'IDLE_WARNING':
      if (event.type === 'IDLE_TICK') {
        if (context.idleCountdown <= 1) {
          newState = 'WELCOME';
          actions.push({ type: 'RESET_SESSION' });
        } else {
          actions.push({ type: 'SET_IDLE_COUNTDOWN', countdown: context.idleCountdown - 1 });
        }
      } else if (event.type === 'IDLE_RESET') {
        newState = 'WELCOME';
        actions.push({ type: 'RESET_SESSION' });
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
  } else if (event.type === 'IDLE_TICK' && state !== 'WELCOME' && state !== 'IDLE_WARNING' && state !== 'ERROR') {
    // Start idle warning after 40 seconds of inactivity (only in interactive states)
    if (context.idleCountdown <= 0) {
      newState = 'IDLE_WARNING';
      actions.push({ type: 'SET_IDLE_COUNTDOWN', countdown: 5 });
    } else {
      actions.push({ type: 'SET_IDLE_COUNTDOWN', countdown: context.idleCountdown - 1 });
    }
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
        newContext.readings = [];
        newContext.stableReadings = [];
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
        console.log('New context after CLEAR_DISH_DATA:', newContext);
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
    readings: [],
    stableReadings: [],
    idleCountdown: 25,
    leaderboard: [],
  };
}
