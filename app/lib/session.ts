
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Teacher } from './auth';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-key';

export function createSession(teacher: Teacher): string {
  return jwt.sign(
    {
      id: teacher.id,
      username: teacher.username,
    },
    SESSION_SECRET,
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

    const decoded = jwt.verify(sessionToken, SESSION_SECRET) as any;
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
