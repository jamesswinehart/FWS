export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'other';

/**
 * Determine current meal period based on local time
 * @returns Current meal period
 */
export function getCurrentMealPeriod(): MealPeriod {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Breakfast: 8:00-10:00 (480-600 minutes)
  if (timeInMinutes >= 480 && timeInMinutes < 600) {
    return 'breakfast';
  }
  
  // Lunch: 11:30-13:30 (690-810 minutes)
  if (timeInMinutes >= 690 && timeInMinutes < 810) {
    return 'lunch';
  }
  
  // Dinner: 17:30-20:00 (1050-1200 minutes)
  if (timeInMinutes >= 1050 && timeInMinutes < 1200) {
    return 'dinner';
  }
  
  // Outside meal hours
  return 'other';
}

/**
 * Get display name for meal period
 * @param period - Meal period
 * @returns Capitalized display name
 */
export function getMealPeriodDisplayName(period: MealPeriod): string {
  return period.charAt(0).toUpperCase() + period.slice(1);
}

/**
 * Get the next meal period and time until it starts
 * @returns Object with next meal info
 */
export function getNextMealInfo(): {
  nextMeal: MealPeriod;
  timeUntilStart: string;
  isCurrentlyMealTime: boolean;
} {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  const currentMeal = getCurrentMealPeriod();
  
  if (currentMeal !== 'other') {
    return {
      nextMeal: currentMeal,
      timeUntilStart: 'Now',
      isCurrentlyMealTime: true
    };
  }
  
  // Determine next meal based on current time
  let nextMeal: MealPeriod;
  let nextMealStartMinutes: number;
  
  if (timeInMinutes < 480) {
    // Before breakfast (8:00)
    nextMeal = 'breakfast';
    nextMealStartMinutes = 480; // 8:00 AM
  } else if (timeInMinutes < 690) {
    // Between breakfast and lunch (10:00-11:30)
    nextMeal = 'lunch';
    nextMealStartMinutes = 690; // 11:30 AM
  } else if (timeInMinutes < 1050) {
    // Between lunch and dinner (13:30-17:30)
    nextMeal = 'dinner';
    nextMealStartMinutes = 1050; // 17:30 (5:30 PM)
  } else {
    // After dinner (20:00+)
    nextMeal = 'breakfast';
    nextMealStartMinutes = 480 + 24 * 60; // Next day 8:00 AM
  }
  
  const minutesUntilStart = nextMealStartMinutes - timeInMinutes;
  const hoursUntilStart = Math.floor(minutesUntilStart / 60);
  const minsUntilStart = minutesUntilStart % 60;
  
  let timeUntilStart: string;
  if (hoursUntilStart > 0) {
    timeUntilStart = `${hoursUntilStart}h ${minsUntilStart}m`;
  } else {
    timeUntilStart = `${minsUntilStart}m`;
  }
  
  return {
    nextMeal,
    timeUntilStart,
    isCurrentlyMealTime: false
  };
}

/**
 * Get meal period with time range for display
 * @param period - Meal period
 * @returns Formatted string with time range
 */
export function getMealPeriodWithTime(period: MealPeriod): string {
  switch (period) {
    case 'breakfast':
      return 'Breakfast (8:00-10:00)';
    case 'lunch':
      return 'Lunch (11:30-13:30)';
    case 'dinner':
      return 'Dinner (17:30-20:00)';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
}

/**
 * Get user's last score for a specific meal period
 * @param netId - User's NetID
 * @param period - Meal period
 * @returns Last score or null if none exists
 */
export function getLastScore(netId: string, period: MealPeriod): number | null {
  try {
    const userScores = JSON.parse(localStorage.getItem(`fws.userScores.${netId}`) || '{}');
    return userScores[period] || null;
  } catch {
    return null;
  }
}

/**
 * Save user's score for a specific meal period
 * @param netId - User's NetID
 * @param period - Meal period
 * @param score - Score to save
 */
export function saveScore(netId: string, period: MealPeriod, score: number): void {
  try {
    const userScores = JSON.parse(localStorage.getItem(`fws.userScores.${netId}`) || '{}');
    userScores[period] = score;
    localStorage.setItem(`fws.userScores.${netId}`, JSON.stringify(userScores));
  } catch (error) {
    console.error('Failed to save score:', error);
  }
}

/**
 * Compare current score with last score for the same meal period
 * @param currentScore - Current score
 * @param lastScore - Previous score for same meal period
 * @returns Comparison result
 */
export function compareScore(currentScore: number, lastScore: number | null): {
  isHigher: boolean;
  isLower: boolean;
  hasComparison: boolean;
} {
  if (lastScore === null) {
    return { isHigher: false, isLower: false, hasComparison: false };
  }
  
  return {
    isHigher: currentScore > lastScore,
    isLower: currentScore < lastScore,
    hasComparison: true,
  };
}
