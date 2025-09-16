
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { studentName, assignmentCode } = await request.json();

    if (!studentName || !assignmentCode) {
      return NextResponse.json(
        { error: 'Student name and assignment code are required' },
        { status: 400 }
      );
    }

    // Validate student name
    if (studentName.length < 2 || studentName.length > 50) {
      return NextResponse.json(
        { error: 'Student name must be between 2-50 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z\s]+$/.test(studentName)) {
      return NextResponse.json(
        { error: 'Student name can only contain letters and spaces' },
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
        { status: 403 }
      );
    }

    // Check capacity limit
    const currentStudentCount = assignment.student_work.length;
    if (currentStudentCount >= assignment.max_students) {
      // Check if this student already exists
      const existingWork = assignment.student_work.find(
        work => work.student_name.toLowerCase() === studentName.toLowerCase()
      );
      
      if (!existingWork) {
        return NextResponse.json(
          { error: 'This assignment has reached its maximum capacity of 30 students.' },
          { status: 403 }
        );
      }
    }

    // Find or create student work
    let studentWork = await prisma.studentWork.findUnique({
      where: {
        assignment_id_student_name: {
          assignment_id: assignment.id,
          student_name: studentName
        }
      }
    });

    let isReturning = false;
    if (!studentWork) {
      // Create new student work entry
      studentWork = await prisma.studentWork.create({
        data: {
          assignment_id: assignment.id,
          student_name: studentName,
          content: '',
          word_count: 0,
          status: 'draft'
        }
      });

      // Update assignment student count
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { student_count: currentStudentCount + 1 }
      });
    } else {
      isReturning = true;
      
      // Check if already submitted
      if (studentWork.status === 'submitted') {
        return NextResponse.json({
          assignment: {
            id: assignment.id,
            title: assignment.title,
            content: assignment.content,
            instructions: assignment.instructions,
          },
          studentWork: {
            id: studentWork.id,
            content: studentWork.content,
            status: studentWork.status,
            submitted_at: studentWork.submitted_at,
            word_count: studentWork.word_count,
          },
          isReturning,
          isSubmitted: true,
        });
      }
    }

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        content: assignment.content,
        instructions: assignment.instructions,
      },
      studentWork: {
        id: studentWork.id,
        content: studentWork.content,
        status: studentWork.status,
        word_count: studentWork.word_count,
      },
      isReturning,
      isSubmitted: false,
    });

  } catch (error) {
    console.error('Student access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
