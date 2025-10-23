import { NextRequest, NextResponse } from 'next/server';

// Simple password protection middleware
export function withPasswordProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Check if user is authenticated
    const isAuthenticated = req.cookies.get('fws-authenticated')?.value === 'true';
    
    if (!isAuthenticated) {
      // Check if this is a login attempt
      if (req.nextUrl.pathname === '/api/auth/login') {
        return handler(req);
      }
      
      // Redirect to login page
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    return handler(req);
  };
}

// Login API endpoint
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  
  // Get password from environment variable
  const correctPassword = process.env.KIOSK_PASSWORD || 'admin123';
  
  if (password === correctPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('fws-authenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    return response;
  }
  
  return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
}
