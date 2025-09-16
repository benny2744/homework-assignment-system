
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacher = getSession();
    if (!teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    const assignmentId = params.id;

    const assignment = await prisma.assignment.findFirst({
      where: { 
        id: assignmentId,
        teacher_id: teacher.id 
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (action === 'close') {
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { 
          status: 'closed',
          closed_at: new Date()
        }
      });

      // Update teacher's active session count
      const activeCount = await prisma.assignment.count({
        where: { 
          teacher_id: teacher.id,
          status: 'active'
        }
      });
      
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { active_sessions_count: activeCount }
      });

      return NextResponse.json({ success: true, message: 'Assignment closed' });
    }

    if (action === 'reopen') {
      // Check session limit before reopening
      const activeAssignments = await prisma.assignment.count({
        where: { 
          teacher_id: teacher.id,
          status: 'active'
        }
      });

      if (activeAssignments >= 3) {
        return NextResponse.json(
          { error: 'Cannot reopen: Maximum of 3 active assignments reached' },
          { status: 409 }
        );
      }

      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { 
          status: 'active',
          activated_at: new Date()
        }
      });

      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { active_sessions_count: activeAssignments + 1 }
      });

      return NextResponse.json({ success: true, message: 'Assignment reopened' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Update assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacher = getSession();
    if (!teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentId = params.id;

    const assignment = await prisma.assignment.findFirst({
      where: { 
        id: assignmentId,
        teacher_id: teacher.id 
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Delete student work first
    await prisma.studentWork.deleteMany({
      where: { assignment_id: assignmentId }
    });

    // Delete assignment
    await prisma.assignment.delete({
      where: { id: assignmentId }
    });

    // Update teacher's active session count
    const activeCount = await prisma.assignment.count({
      where: { 
        teacher_id: teacher.id,
        status: 'active'
      }
    });
    
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { active_sessions_count: activeCount }
    });

    return NextResponse.json({ success: true, message: 'Assignment deleted' });

  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
