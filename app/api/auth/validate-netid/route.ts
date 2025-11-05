import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeDatabase, 
  isNetIdAllowed
} from '../../../../lib/supabase';

// Initialize database on first request
let dbInitialized = false;
async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// POST /api/auth/validate-netid - Validate if a NetID is allowed
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const body = await request.json();
    const { netid } = body;
    
    if (!netid || typeof netid !== 'string') {
      return NextResponse.json(
        { error: 'netid is required and must be a string' },
        { status: 400 }
      );
    }
    
    const isValid = await isNetIdAllowed(netid);
    
    return NextResponse.json({ 
      allowed: isValid,
      netid: netid.toLowerCase().trim()
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate NetID', allowed: false },
      { status: 500 }
    );
  }
}

// GET /api/auth/validate-netid?netid=xxx - Validate if a NetID is allowed (alternative method)
export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const { searchParams } = new URL(request.url);
    const netid = searchParams.get('netid');
    
    if (!netid) {
      return NextResponse.json(
        { error: 'netid is required', allowed: false },
        { status: 400 }
      );
    }
    
    const isValid = await isNetIdAllowed(netid);
    
    return NextResponse.json({ 
      allowed: isValid,
      netid: netid.toLowerCase().trim()
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate NetID', allowed: false },
      { status: 500 }
    );
  }
}


