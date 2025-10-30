# Idle Timer Debug Test

## Current Status
- App is running at http://localhost:3000
- Status bar shows "Idle: 40s" 
- Debug logging added to dispatch function
- Debug logging added to idle timer interval
- Debug logging added to state machine

## How to Test the Idle Timer

1. **Open the app** in your browser: http://localhost:3000
2. **Open browser dev tools** (F12) and go to Console tab
3. **Look for these debug messages**:
   - `Setting up idle timer interval`
   - `Idle timer tick - dispatching IDLE_TICK` (every second)
   - `Dispatching event: IDLE_TICK Current state: WELCOME Countdown: 25`
   - `IDLE_TICK: countdown=25, state=WELCOME` (from state machine)

4. **Watch the status bar** - the countdown should decrease from 25 to 0
5. **If you see the debug messages** but countdown doesn't change, there's a state update issue
6. **If you don't see the debug messages**, the interval isn't running

## Expected Debug Output
```
Setting up idle timer interval
Idle timer tick - dispatching IDLE_TICK
Dispatching event: IDLE_TICK Current state: WELCOME Countdown: 25
IDLE_TICK: countdown=25, state=WELCOME
Idle timer tick - dispatching IDLE_TICK
Dispatching event: IDLE_TICK Current state: WELCOME Countdown: 24
IDLE_TICK: countdown=24, state=WELCOME
... (continues every second)
```

## Quick Test
- **Press 'D'** to show debug panel
- **Click "Force Idle"** button to instantly trigger idle warning
- **Press 'T'** key to trigger idle warning

## If Still Not Working
The issue might be:
1. **State updates not triggering re-renders**
2. **Context not updating properly**
3. **useEffect dependencies causing issues**
4. **State machine not processing events**

Check the browser console for debug messages to identify the issue.
