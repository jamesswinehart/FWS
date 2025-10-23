import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    
    // Get password from environment variable
    const correctPassword = process.env.KIOSK_PASSWORD || 'admin123';
    
    if (password === correctPassword) {
      const response = NextResponse.json({ success: true });
      
      // Set authentication cookie
      response.cookies.set('fws-authenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      
      return response;
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid access code' 
    }, { status: 401 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, { status: 500 });
  }
}
