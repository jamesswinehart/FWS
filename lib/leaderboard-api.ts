import { LeaderboardEntry } from './database';

// Re-export types for convenience
export type { LeaderboardEntry };

// Fallback to localStorage if database is not available
export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = localStorage.getItem('fws.leaderboard');
    const entries = stored ? JSON.parse(stored) : [];
    return entries.sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher scores first
      }
      // For same scores, earlier submissions (lower timestamp) get higher rank
      return a.created_at && b.created_at ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() : 0;
    });
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
    return [];
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem('fws.leaderboard', JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save leaderboard:', error);
  }
}

export async function loadLeaderboardFromAPI(): Promise<LeaderboardEntry[]> {
  try {
    // Temporarily increase limit to see all entries
    const response = await fetch('/api/leaderboard?limit=50');
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load leaderboard from API:', error);
    // Fallback to localStorage
    return loadLeaderboard();
  }
}

export async function addLeaderboardEntryToAPI(newEntry: Omit<LeaderboardEntry, 'id' | 'created_at'>): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEntry),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add leaderboard entry');
    }
    
    // Return updated leaderboard
    return await loadLeaderboardFromAPI();
  } catch (error) {
    console.error('Failed to add leaderboard entry to API:', error);
    // Fallback to localStorage
    const currentLeaderboard = loadLeaderboard();
    const updatedLeaderboard = [...currentLeaderboard, newEntry as LeaderboardEntry]
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score; // Higher scores first
        }
        // For same scores, earlier submissions (lower timestamp) get higher rank
        return a.created_at && b.created_at ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() : 0;
      })
      .slice(0, 10);
    saveLeaderboard(updatedLeaderboard);
    return updatedLeaderboard;
  }
}

export function qualifiesForLeaderboard(score: number): boolean {
  // Allow all scores to be submitted
  return true;
}

export function getLeaderboardStats(entries: LeaderboardEntry[]) {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0
    };
  }
  
  const scores = entries.map(entry => entry.score);
  const totalEntries = entries.length;
  const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / totalEntries);
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  
  return {
    totalEntries,
    averageScore,
    highestScore,
    lowestScore
  };
}
