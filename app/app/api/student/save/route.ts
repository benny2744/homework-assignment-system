
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { countWords, generateSessionToken } from '@/lib/utils';

export const dynamic = "force-dynamic";

// Auto-save student work
export async function POST(req: NextRequest) {
  try {
    const { assignmentId, studentName, content, sessionToken } = await req.json();

    if (!assignmentId || !studentName || content === undefined) {
      return NextResponse.json(
        { error: 'Assignment ID, student name, and content are required' },
        { status: 400 }
      );
    }

    // Verify assignment is active
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment || assignment.status !== 'active') {
      return NextResponse.json(
        { error: 'Assignment is not available for saving' },
        { status: 400 }
      );
    }

    // Check if already submitted final
    const existingFinal = await prisma.studentWork.findUnique({
      where: {
        assignment_id_student_name_status: {
          assignment_id: assignmentId,
          student_name: studentName.trim(),
          status: 'final'
        }
      }
    });

    if (existingFinal) {
      return NextResponse.json(
        { error: 'Assignment already submitted' },
        { status: 400 }
      );
    }

    const wordCount = countWords(content);
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

    // Upsert draft
    const studentWork = await prisma.studentWork.upsert({
      where: {
        assignment_id_student_name_status: {
          assignment_id: assignmentId,
          student_name: studentName.trim(),
          status: 'draft'
        }
      },
      update: {
        content: content.trim(),
        word_count: wordCount,
        last_saved_at: new Date(),
        ip_address: clientIp,
        session_id: sessionToken || generateSessionToken()
      },
      create: {
        assignment_id: assignmentId,
        student_name: studentName.trim(),
        content: content.trim(),
        word_count: wordCount,
        status: 'draft',
        ip_address: clientIp,
        session_id: sessionToken || generateSessionToken()
      }
    });

    // Update or create auto-save session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.autoSaveSession.upsert({
      where: { session_token: studentWork.session_id! },
      update: {
        last_activity: new Date(),
        expires_at: expiresAt
      },
      create: {
        student_work_id: studentWork.id,
        session_token: studentWork.session_id!,
        expires_at: expiresAt
      }
    });

    return NextResponse.json({
      success: true,
      savedAt: studentWork.last_saved_at,
      wordCount: wordCount,
      sessionToken: studentWork.session_id
    });
  } catch (error) {
    console.error('Error saving student work:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
