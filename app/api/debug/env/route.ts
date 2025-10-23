import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Check environment variables
  const envCheck = {
    USER_STORAGE_SUPABASE_URL: !!process.env.USER_STORAGE_SUPABASE_URL,
    USER_STORAGE_SUPABASE_ANON_KEY: !!process.env.USER_STORAGE_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_USER_STORAGE_SUPABASE_URL: !!process.env.NEXT_PUBLIC_USER_STORAGE_SUPABASE_URL,
    NEXT_PUBLIC_USER_STORAGE_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_USER_STORAGE_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    KIOSK_PASSWORD: !!process.env.KIOSK_PASSWORD,
  };

  // Show actual values (first 20 chars for security)
  const values = {
    USER_STORAGE_SUPABASE_URL: process.env.USER_STORAGE_SUPABASE_URL?.substring(0, 20) + '...',
    USER_STORAGE_SUPABASE_ANON_KEY: process.env.USER_STORAGE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    NEXT_PUBLIC_USER_STORAGE_SUPABASE_URL: process.env.NEXT_PUBLIC_USER_STORAGE_SUPABASE_URL?.substring(0, 20) + '...',
    NEXT_PUBLIC_USER_STORAGE_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_USER_STORAGE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    KIOSK_PASSWORD: process.env.KIOSK_PASSWORD ? 'SET' : 'NOT SET',
  };

  return NextResponse.json({
    message: 'Environment variable check',
    envCheck,
    values,
    timestamp: new Date().toISOString()
  });
}
