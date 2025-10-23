import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase, 
  saveUserScore, 
  getUserLastScore, 
  getUserScores
} from '../../../lib/database';

// Initialize database on first request
let dbInitialized = false;
async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// POST /api/scores - Save a new user score
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const body = await request.json();
    const { netid, meal_period, score, dish_type, weight_grams } = body;
    
    if (!netid || !meal_period || score === undefined || !dish_type || weight_grams === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await saveUserScore({
      netid,
      meal_period,
      score,
      dish_type,
      weight_grams
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to save score' },
      { status: 500 }
    );
  }
}

// GET /api/scores?netid=xxx&meal_period=xxx - Get user's last score for a meal
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const { searchParams } = new URL(request.url);
    const netid = searchParams.get('netid');
    const meal_period = searchParams.get('meal_period');
    
    if (!netid) {
      return NextResponse.json(
        { error: 'netid is required' },
        { status: 400 }
      );
    }
    
    if (meal_period) {
      // Get last score for specific meal period
      const result = await getUserLastScore(netid, meal_period);
      return NextResponse.json(result);
    } else {
      // Get all scores for user
      const result = await getUserScores(netid);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get scores' },
      { status: 500 }
    );
  }
}
