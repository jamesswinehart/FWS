import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase, 
  getLeaderboard, 
  addLeaderboardEntry, 
  getLeaderboardStats
} from '../../../lib/database';

// Initialize database on first request
let dbInitialized = false;
async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// GET /api/leaderboard - Get leaderboard entries
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const entries = await getLeaderboard(limit);
    return NextResponse.json(entries);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get leaderboard' },
      { status: 500 }
    );
  }
}

// POST /api/leaderboard - Add new leaderboard entry
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const body = await request.json();
    const { initials, score, netid, meal_period } = body;
    
    if (!initials || score === undefined) {
      return NextResponse.json(
        { error: 'initials and score are required' },
        { status: 400 }
      );
    }
    
    const result = await addLeaderboardEntry({
      initials,
      score,
      netid: netid || null,
      meal_period: meal_period || null
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to add leaderboard entry' },
      { status: 500 }
    );
  }
}
