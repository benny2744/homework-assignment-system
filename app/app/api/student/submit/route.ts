
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { studentWorkId, content } = await request.json();

    if (!studentWorkId || content === undefined) {
      return NextResponse.json(
        { error: 'Student work ID and content are required' },
        { status: 400 }
      );
    }

    // Find student work
    const studentWork = await prisma.studentWork.findUnique({
      where: { id: studentWorkId },
      include: { assignment: true }
    });

    if (!studentWork) {
      return NextResponse.json(
        { error: 'Student work not found' },
        { status: 404 }
      );
    }

    // Check if assignment is still active
    if (studentWork.assignment.status !== 'active') {
      return NextResponse.json(
        { error: 'Assignment is no longer active' },
        { status: 403 }
      );
    }

    // Check if already submitted
    if (studentWork.status === 'submitted') {
      return NextResponse.json(
        { error: 'Work has already been submitted' },
        { status: 403 }
      );
    }

    // Count words
    const wordCount = content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;

    // Update student work to submitted status
    const submittedWork = await prisma.studentWork.update({
      where: { id: studentWorkId },
      data: {
        content: content,
        word_count: wordCount,
        status: 'submitted',
        submitted_at: new Date(),
        last_saved_at: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      studentWork: {
        id: submittedWork.id,
        content: submittedWork.content,
        word_count: submittedWork.word_count,
        status: submittedWork.status,
        submitted_at: submittedWork.submitted_at,
      },
      message: 'Assignment submitted successfully!'
    });

  } catch (error) {
    console.error('Submit assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
