
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { countWords } from '@/lib/utils';

export const dynamic = "force-dynamic";

// Submit final assignment
export async function POST(req: NextRequest) {
  try {
    const { assignmentId, studentName, content } = await req.json();

    if (!assignmentId || !studentName || !content?.trim()) {
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
        { error: 'Assignment is not available for submission' },
        { status: 400 }
      );
    }

    // Check deadline
    if (assignment.deadline && assignment.deadline < new Date()) {
      return NextResponse.json(
        { error: 'Assignment deadline has passed' },
        { status: 400 }
      );
    }

    // Check if already submitted
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

    // Create final submission
    const submission = await prisma.studentWork.create({
      data: {
        assignment_id: assignmentId,
        student_name: studentName.trim(),
        content: content.trim(),
        word_count: wordCount,
        status: 'final',
        submitted_at: new Date(),
        ip_address: clientIp
      }
    });

    // Delete draft if exists
    await prisma.studentWork.deleteMany({
      where: {
        assignment_id: assignmentId,
        student_name: studentName.trim(),
        status: 'draft'
      }
    });

    // Update assignment student count
    const uniqueStudents = await prisma.studentWork.findMany({
      where: { assignment_id: assignmentId },
      distinct: ['student_name'],
      select: { student_name: true }
    });

    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { student_count: uniqueStudents.length }
    });

    return NextResponse.json({
      success: true,
      submittedAt: submission.submitted_at,
      wordCount: wordCount,
      submissionId: submission.id
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
