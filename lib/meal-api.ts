import { getCurrentMealPeriod, getMealPeriodDisplayName, getMealPeriodWithTime } from './meal';

// Fallback to localStorage if database is not available
export function getLastScore(netId: string, mealPeriod: string): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(`fws.userScores.${netId}`);
    const scores = stored ? JSON.parse(stored) : {};
    return scores[mealPeriod] || null;
  } catch (error) {
    console.error('Failed to get last score:', error);
    return null;
  }
}

export function saveScore(netId: string, mealPeriod: string, score: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const stored = localStorage.getItem(`fws.userScores.${netId}`);
    const scores = stored ? JSON.parse(stored) : {};
    scores[mealPeriod] = score;
    localStorage.setItem(`fws.userScores.${netId}`, JSON.stringify(scores));
  } catch (error) {
    console.error('Failed to save score:', error);
  }
}

export async function getLastScoreFromAPI(netId: string, mealPeriod: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/scores?netid=${encodeURIComponent(netId)}&meal_period=${encodeURIComponent(mealPeriod)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch last score');
    }
    const data = await response.json();
    return data ? data.score : null;
  } catch (error) {
    console.error('Failed to get last score from API:', error);
    // Fallback to localStorage
    return getLastScore(netId, mealPeriod);
  }
}

export async function saveScoreToAPI(netId: string, mealPeriod: string, score: number, dishType: string, weightGrams: number): Promise<void> {
  try {
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        netid: netId,
        meal_period: mealPeriod,
        score,
        dish_type: dishType,
        weight_grams: weightGrams
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save score');
    }
  } catch (error) {
    console.error('Failed to save score to API:', error);
    // Fallback to localStorage
    saveScore(netId, mealPeriod, score);
  }
}

export function compareScore(currentScore: number, lastScore: number | null): string {
  if (lastScore === null) {
    return 'This is your first score for this meal period!';
  }
  
  if (currentScore > lastScore) {
    return `Higher than your last ${getCurrentMealPeriod()} score!`;
  } else if (currentScore < lastScore) {
    return `Lower than your last ${getCurrentMealPeriod()} score.`;
  } else {
    return `Same as your last ${getCurrentMealPeriod()} score.`;
  }
}

// Re-export meal utilities
export { getCurrentMealPeriod, getMealPeriodDisplayName, getMealPeriodWithTime };
