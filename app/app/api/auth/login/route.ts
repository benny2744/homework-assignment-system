
import { NextRequest, NextResponse } from 'next/server';
import { validateTeacher } from '@/lib/auth';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const teacher = await validateTeacher(username, password);
    
    if (!teacher) {
      return NextResponse.json(
        { error: 'Invalid credentials or account is locked' },
        { status: 401 }
      );
    }

    const sessionToken = createSession(teacher);
    
    const response = NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        username: teacher.username,
        active_sessions_count: teacher.active_sessions_count,
      }
    });

    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7200, // 2 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
