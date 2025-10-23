import { sql } from '@vercel/postgres';

// Database types
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

// Database initialization
export async function initializeDatabase() {
  try {
    // Create user_scores table
    await sql`
      CREATE TABLE IF NOT EXISTS user_scores (
        id SERIAL PRIMARY KEY,
        netid VARCHAR(50) NOT NULL,
        meal_period VARCHAR(20) NOT NULL,
        score INTEGER NOT NULL,
        dish_type VARCHAR(20) NOT NULL,
        weight_grams DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create leaderboard_entries table
    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard_entries (
        id SERIAL PRIMARY KEY,
        initials VARCHAR(3) NOT NULL,
        score INTEGER NOT NULL,
        netid VARCHAR(50),
        meal_period VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_scores_netid_meal 
      ON user_scores(netid, meal_period);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_score 
      ON leaderboard_entries(score DESC, created_at DESC);
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// User scores functions
export async function saveUserScore(score: Omit<UserScore, 'id' | 'created_at'>) {
  try {
    const result = await sql`
      INSERT INTO user_scores (netid, meal_period, score, dish_type, weight_grams)
      VALUES (${score.netid}, ${score.meal_period}, ${score.score}, ${score.dish_type}, ${score.weight_grams})
      RETURNING id, created_at;
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Failed to save user score:', error);
    throw error;
  }
}

export async function getUserLastScore(netid: string, mealPeriod: string) {
  try {
    const result = await sql`
      SELECT score, created_at
      FROM user_scores 
      WHERE netid = ${netid} AND meal_period = ${mealPeriod}
      ORDER BY created_at DESC 
      LIMIT 1;
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Failed to get user last score:', error);
    throw error;
  }
}

export async function getUserScores(netid: string) {
  try {
    const result = await sql`
      SELECT meal_period, score, created_at
      FROM user_scores 
      WHERE netid = ${netid}
      ORDER BY created_at DESC;
    `;
    return result.rows;
  } catch (error) {
    console.error('Failed to get user scores:', error);
    throw error;
  }
}

// Leaderboard functions
export async function getLeaderboard(limit: number = 10) {
  try {
    const result = await sql`
      SELECT initials, score, netid, meal_period, created_at
      FROM leaderboard_entries 
      ORDER BY score DESC, created_at DESC
      LIMIT ${limit};
    `;
    return result.rows;
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    throw error;
  }
}

export async function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>) {
  try {
    const result = await sql`
      INSERT INTO leaderboard_entries (initials, score, netid, meal_period)
      VALUES (${entry.initials}, ${entry.score}, ${entry.netid || null}, ${entry.meal_period || null})
      RETURNING id, created_at;
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Failed to add leaderboard entry:', error);
    throw error;
  }
}

export async function getLeaderboardStats() {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total_entries,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score
      FROM leaderboard_entries;
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Failed to get leaderboard stats:', error);
    throw error;
  }
}

// Analytics functions
export async function getDailyStats(date?: string) {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = await sql`
      SELECT 
        COUNT(*) as total_scans,
        AVG(score) as average_score,
        COUNT(DISTINCT netid) as unique_users
      FROM user_scores 
      WHERE DATE(created_at) = ${targetDate};
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Failed to get daily stats:', error);
    throw error;
  }
}

export async function getMealPeriodStats(mealPeriod: string) {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total_scans,
        AVG(score) as average_score,
        COUNT(DISTINCT netid) as unique_users
      FROM user_scores 
      WHERE meal_period = ${mealPeriod};
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Failed to get meal period stats:', error);
    throw error;
  }
}
