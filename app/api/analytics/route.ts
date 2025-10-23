import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase, 
  getDailyStats,
  getMealPeriodStats
} from '../../../lib/supabase';

// Initialize database on first request
let dbInitialized = false;
async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const date = searchParams.get('date');
    const meal_period = searchParams.get('meal_period');
    
    let result;
    
    switch (type) {
      case 'daily':
        result = await getDailyStats(date || undefined);
        break;
      case 'meal':
        if (!meal_period) {
          return NextResponse.json(
            { error: 'meal_period is required for meal analytics' },
            { status: 400 }
          );
        }
        result = await getMealPeriodStats(meal_period);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type. Use "daily" or "meal"' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
