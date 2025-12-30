
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Teacher } from './auth';

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    // Important: do not throw at module import time (Next.js may import route handlers at build).
    throw new Error('SESSION_SECRET is required in production');
  }
  return secret || 'dev-fallback-secret-key';
}

export function createSession(teacher: Teacher): string {
  return jwt.sign(
    {
      id: teacher.id,
      username: teacher.username,
    },
    getSessionSecret(),
    { expiresIn: '2h' }
  );
}

export function getSession(): Teacher | null {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    
    if (!sessionToken) {
      return null;
    }

    const decoded = jwt.verify(sessionToken, getSessionSecret()) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      active_sessions_count: 0, // Will be fetched from DB when needed
    };
  } catch (error) {
    return null;
  }
}

export function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete('session-token');
}
