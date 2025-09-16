
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

// Validate student access and check capacity
export async function POST(req: NextRequest) {
  try {
    const { studentName, assignmentCode } = await req.json();

    if (!studentName || !assignmentCode) {
      return NextResponse.json(
        { error: 'Student name and assignment code are required' },
        { status: 400 }
      );
    }

    // Validate student name format
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    if (!nameRegex.test(studentName.trim())) {
      return NextResponse.json(
        { error: 'Invalid student name format. Use only letters and spaces (2-50 characters)' },
        { status: 400 }
      );
    }

    // Find assignment
    const assignment = await prisma.assignment.findUnique({
      where: { assignment_code: assignmentCode.toUpperCase() },
      include: {
        student_work: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found. Please check the assignment code.' },
        { status: 404 }
      );
    }

    if (assignment.status !== 'active') {
      return NextResponse.json(
        { error: 'This assignment is not currently available.' },
        { status: 400 }
      );
    }

    // Check if assignment has expired
    if (assignment.deadline && assignment.deadline < new Date()) {
      return NextResponse.json(
        { error: 'This assignment has passed its deadline.' },
        { status: 400 }
      );
    }

    // Check existing student work
    const existingWork = await prisma.studentWork.findUnique({
      where: {
        assignment_id_student_name_status: {
          assignment_id: assignment.id,
          student_name: studentName.trim(),
          status: 'final'
        }
      }
    });

    if (existingWork) {
      return NextResponse.json(
        { error: 'You have already submitted this assignment.' },
        { status: 400 }
      );
    }

    // Check capacity - count unique student names (excluding those who already submitted final)
    const uniqueStudents = new Set(
      assignment.student_work
        .filter(work => work.status === 'draft' || work.status === 'final')
        .map(work => work.student_name)
    );

    const currentStudentCount = uniqueStudents.size;
    const isExistingStudent = uniqueStudents.has(studentName.trim());

    if (!isExistingStudent && currentStudentCount >= assignment.max_students) {
      return NextResponse.json(
        { 
          error: 'This assignment has reached its maximum capacity of 30 students. Please contact your teacher for alternative arrangements.',
          atCapacity: true
        },
        { status: 400 }
      );
    }

    // Check for existing draft
    const existingDraft = await prisma.studentWork.findUnique({
      where: {
        assignment_id_student_name_status: {
          assignment_id: assignment.id,
          student_name: studentName.trim(),
          status: 'draft'
        }
      }
    });

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        content: assignment.content,
        instructions: assignment.instructions,
        deadline: assignment.deadline
      },
      existingDraft: existingDraft ? {
        content: existingDraft.content,
        lastSaved: existingDraft.last_saved_at,
        wordCount: existingDraft.word_count
      } : null,
      studentCount: currentStudentCount,
      maxStudents: assignment.max_students
    });
  } catch (error) {
    console.error('Error validating student access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
