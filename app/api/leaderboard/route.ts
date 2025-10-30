import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase, 
  getLeaderboard, 
  addLeaderboardEntry
} from '../../../lib/supabase';

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
    
    console.log('GET /api/leaderboard - Fetching entries with limit:', limit);
    const entries = await getLeaderboard(limit);
    console.log('GET /api/leaderboard - Found entries:', entries);
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
    console.log('📝 POST /api/leaderboard - Received entry:', body);
    const { initials, score, netid, meal_period } = body;
    
    if (!initials || score === undefined) {
    console.log('Missing required fields - initials:', initials, 'score:', score);
      return NextResponse.json(
        { error: 'initials and score are required' },
        { status: 400 }
      );
    }
    
    console.log('Adding leaderboard entry to database...');
    const result = await addLeaderboardEntry({
      initials,
      score,
      netid: netid || null,
      meal_period: meal_period || null
    });
    
    console.log('Successfully added leaderboard entry:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to add leaderboard entry' },
      { status: 500 }
    );
  }
}
