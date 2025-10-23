# Idle Timer Debug Instructions

## How to Test the Idle Timer

1. **Open the app** at http://localhost:3000
2. **Press 'D'** to show the debug panel
3. **Watch the idle countdown** in the debug panel - it should count down from 40 to 0
4. **Test buttons**:
   - **Test Idle** (yellow): Sets countdown to 0, should trigger idle warning
   - **Force Idle** (red): Also sets countdown to 0
5. **Check browser console** for debug logs:
   - `Idle countdown: Xs, State: Y` every 10 seconds
   - `User activity detected, resetting idle timer to 40s` when you interact

## Expected Behavior

- **Idle countdown** should decrease from 40 to 0 over 40 seconds
- **No user interaction** should allow the timer to reach 0
- **User interaction** (click, keypress, touch) should reset timer to 40
- **At 0 seconds** should show "Still there? Starting over in 5..." screen
- **After 5 seconds** should return to Welcome screen

## Debug Steps

1. **Check if timer is counting down**: Look at debug panel
2. **Check if user activity resets it**: Click somewhere and see if timer resets
3. **Check if idle warning appears**: Wait for timer to reach 0
4. **Check console logs**: Open browser dev tools → Console

## Possible Issues

- **Scale readings** might be interfering (they shouldn't reset the timer)
- **User activity detection** might be too sensitive
- **State machine** might not be transitioning properly
- **Timer interval** might not be running

## Quick Test

Press **'T'** key to instantly trigger idle warning for testing.
