
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('session-token');
  // Ensure deletion covers the same path as the login cookie
  response.cookies.set('session-token', '', { maxAge: 0, path: '/' });
  return response;
}
