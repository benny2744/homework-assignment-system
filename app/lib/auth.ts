
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Teacher {
  id: string;
  username: string;
  active_sessions_count: number;
}

export async function validateTeacher(username: string, password: string): Promise<Teacher | null> {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { username },
    });

    if (!teacher) {
      return null;
    }

    // Check if account is locked
    if (teacher.locked_until && teacher.locked_until > new Date()) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, teacher.password_hash);

    if (!isPasswordValid) {
      // Increment failed attempts
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          failed_attempts: teacher.failed_attempts + 1,
          locked_until: teacher.failed_attempts >= 4 
            ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            : null
        }
      });
      return null;
    }

    // Reset failed attempts and update last login
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        failed_attempts: 0,
        locked_until: null,
        last_login: new Date(),
      }
    });

    return {
      id: teacher.id,
      username: teacher.username,
      active_sessions_count: teacher.active_sessions_count,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function createTeacher(username: string, password: string): Promise<Teacher | null> {
  try {
    // Check if username exists
    const existing = await prisma.teacher.findUnique({
      where: { username },
    });

    if (existing) {
      return null;
    }

    const password_hash = await bcrypt.hash(password, 12);
    
    const teacher = await prisma.teacher.create({
      data: {
        username,
        password_hash,
        active_sessions_count: 0,
        failed_attempts: 0,
      },
    });

    return {
      id: teacher.id,
      username: teacher.username,
      active_sessions_count: teacher.active_sessions_count,
    };
  } catch (error) {
    console.error('Create teacher error:', error);
    return null;
  }
}
