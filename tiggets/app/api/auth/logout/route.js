import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    
    // Destroy the session cookie by setting its expiration date to the past
    response.headers.set(
      'Set-Cookie',
      'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
    );

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}