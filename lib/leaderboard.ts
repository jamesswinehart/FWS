export type LeaderboardEntry = {
  initials: string;
  score: number;
  ts: number;
  netId?: string; // Optional for privacy
  mealPeriod?: string; // Track which meal this was for
};

export type LeaderboardStats = {
  totalEntries: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  recentEntries: LeaderboardEntry[];
};

/**
 * Load leaderboard from localStorage
 * @returns Array of leaderboard entries, sorted by score (descending)
 */
export function loadLeaderboard(): LeaderboardEntry[] {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem('fws.leaderboard');
    const entries = stored ? JSON.parse(stored) : [];
    
    // Sort by score (highest first), then by timestamp (most recent first for ties)
    return entries.sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher scores first
      }
      return b.ts - a.ts; // More recent first for ties
    });
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
    return [];
  }
}

/**
 * Save leaderboard to localStorage
 * @param leaderboard - Array of leaderboard entries
 */
export function saveLeaderboard(leaderboard: LeaderboardEntry[]): void {
  try {
    localStorage.setItem('fws.leaderboard', JSON.stringify(leaderboard));
  } catch (error) {
    console.error('Failed to save leaderboard:', error);
  }
}

/**
 * Add a new entry to the leaderboard
 * @param entry - New leaderboard entry
 * @param maxEntries - Maximum number of entries to keep (default: 50)
 * @returns Updated leaderboard
 */
export function addLeaderboardEntry(
  entry: LeaderboardEntry, 
  maxEntries: number = 50
): LeaderboardEntry[] {
  const leaderboard = loadLeaderboard();
  
  // Add new entry
  leaderboard.push(entry);
  
  // Sort by score (highest first), then by timestamp (most recent first for ties)
  leaderboard.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return b.ts - a.ts;
  });
  
  // Keep only top entries
  const trimmedLeaderboard = leaderboard.slice(0, maxEntries);
  
  // Save updated leaderboard
  saveLeaderboard(trimmedLeaderboard);
  
  return trimmedLeaderboard;
}

/**
 * Get leaderboard statistics
 * @returns Statistics about the leaderboard
 */
export function getLeaderboardStats(): LeaderboardStats {
  const leaderboard = loadLeaderboard();
  
  if (leaderboard.length === 0) {
    return {
      totalEntries: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      recentEntries: [],
    };
  }
  
  const scores = leaderboard.map(entry => entry.score);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  
  return {
    totalEntries: leaderboard.length,
    averageScore: Math.round(totalScore / leaderboard.length),
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    recentEntries: leaderboard.slice(0, 10), // Top 10
  };
}

/**
 * Check if a score qualifies for the leaderboard
 * @param score - Score to check
 * @param minScore - Minimum score to qualify (default: 50)
 * @returns True if score qualifies
 */
export function qualifiesForLeaderboard(score: number, minScore: number = 50): boolean {
  return score >= minScore;
}

/**
 * Get user's best score
 * @param netId - User's NetID
 * @returns Best score or null if none exists
 */
export function getUserBestScore(netId: string): number | null {
  try {
    const userScores = JSON.parse(localStorage.getItem(`fws.userScores.${netId}`) || '{}');
    const scores = Object.values(userScores) as number[];
    return scores.length > 0 ? Math.max(...scores) : null;
  } catch {
    return null;
  }
}

/**
 * Get user's leaderboard rank
 * @param netId - User's NetID
 * @returns Rank (1-based) or null if not found
 */
export function getUserRank(netId: string): number | null {
  const leaderboard = loadLeaderboard();
  const userEntry = leaderboard.find(entry => entry.netId === netId);
  return userEntry ? leaderboard.indexOf(userEntry) + 1 : null;
}

/**
 * Clear all leaderboard data (for testing/reset)
 */
export function clearLeaderboard(): void {
  try {
    localStorage.removeItem('fws.leaderboard');
    // Also clear user scores
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('fws.userScores.')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear leaderboard:', error);
  }
}
