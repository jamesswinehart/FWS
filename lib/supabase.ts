import { createClient } from '@supabase/supabase-js';

// Supabase types
export interface UserScore {
  id?: number;
  netid: string;
  meal_period: 'breakfast' | 'lunch' | 'dinner' | 'other';
  score: number;
  dish_type: 'plate' | 'salad' | 'cereal';
  weight_grams: number;
  created_at?: string;
}

export interface LeaderboardEntry {
  id?: number;
  initials: string;
  score: number;
  netid?: string;
  meal_period?: 'breakfast' | 'lunch' | 'dinner' | 'other';
  created_at?: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.USER_STORAGE_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_USER_STORAGE_SUPABASE_URL || 
                   'https://placeholder.supabase.co';

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                   process.env.USER_STORAGE_SUPABASE_ANON_KEY || 
                   process.env.NEXT_PUBLIC_USER_STORAGE_SUPABASE_ANON_KEY || 
                   'placeholder-key';

// Debug logging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
console.log('Environment check:', {
  NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  USER_STORAGE_SUPABASE_URL: !!process.env.USER_STORAGE_SUPABASE_URL,
  NEXT_PUBLIC_USER_STORAGE_SUPABASE_URL: !!process.env.NEXT_PUBLIC_USER_STORAGE_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  USER_STORAGE_SUPABASE_ANON_KEY: !!process.env.USER_STORAGE_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_USER_STORAGE_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_USER_STORAGE_SUPABASE_ANON_KEY
});

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database initialization
export async function initializeDatabase() {
  try {
    // Create user_scores table
    const { error: scoresError } = await supabase.rpc('create_user_scores_table');
    if (scoresError && !scoresError.message.includes('already exists')) {
      console.error('Error creating user_scores table:', scoresError);
    }

    // Create leaderboard_entries table
    const { error: leaderboardError } = await supabase.rpc('create_leaderboard_table');
    if (leaderboardError && !leaderboardError.message.includes('already exists')) {
      console.error('Error creating leaderboard_entries table:', leaderboardError);
    }

    console.log('Supabase database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// User scores functions
export async function saveUserScore(score: Omit<UserScore, 'id' | 'created_at'>) {
  try {
    console.log('Saving user score:', score);
    
    const { data, error } = await supabase
      .from('user_scores')
      .insert([score])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving user score:', error);
      throw error;
    }
    
    console.log('Successfully saved user score:', data);
    return data;
  } catch (error) {
    console.error('Failed to save user score:', error);
    throw error;
  }
}

export async function getUserLastScore(netid: string, mealPeriod: string) {
  try {
    const { data, error } = await supabase
      .from('user_scores')
      .select('score, created_at')
      .eq('netid', netid)
      .eq('meal_period', mealPeriod)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  } catch (error) {
    console.error('Failed to get user last score:', error);
    throw error;
  }
}

export async function getUserScores(netid: string) {
  try {
    const { data, error } = await supabase
      .from('user_scores')
      .select('meal_period, score, created_at')
      .eq('netid', netid)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get user scores:', error);
    throw error;
  }
}

// Leaderboard functions
export async function getLeaderboard(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('initials, score, netid, meal_period, created_at')
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    throw error;
  }
}

export async function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .insert([entry])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to add leaderboard entry:', error);
    throw error;
  }
}

export async function getLeaderboardStats() {
  try {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('score');
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        total_entries: 0,
        average_score: 0,
        highest_score: 0,
        lowest_score: 0
      };
    }
    
    const scores = data.map(entry => entry.score);
    const totalEntries = scores.length;
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / totalEntries);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    
    return {
      total_entries: totalEntries,
      average_score: averageScore,
      highest_score: highestScore,
      lowest_score: lowestScore
    };
  } catch (error) {
    console.error('Failed to get leaderboard stats:', error);
    throw error;
  }
}

// Analytics functions
export async function getDailyStats(date?: string) {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('user_scores')
      .select('score, netid')
      .gte('created_at', `${targetDate}T00:00:00`)
      .lt('created_at', `${targetDate}T23:59:59`);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        total_scans: 0,
        average_score: 0,
        unique_users: 0
      };
    }
    
    const scores = data.map(entry => entry.score);
    const uniqueUsers = new Set(data.map(entry => entry.netid)).size;
    
    return {
      total_scans: data.length,
      average_score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      unique_users: uniqueUsers
    };
  } catch (error) {
    console.error('Failed to get daily stats:', error);
    throw error;
  }
}

export async function getMealPeriodStats(mealPeriod: string) {
  try {
    const { data, error } = await supabase
      .from('user_scores')
      .select('score, netid')
      .eq('meal_period', mealPeriod);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        total_scans: 0,
        average_score: 0,
        unique_users: 0
      };
    }
    
    const scores = data.map(entry => entry.score);
    const uniqueUsers = new Set(data.map(entry => entry.netid)).size;
    
    return {
      total_scans: data.length,
      average_score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      unique_users: uniqueUsers
    };
  } catch (error) {
    console.error('Failed to get meal period stats:', error);
    throw error;
  }
}
