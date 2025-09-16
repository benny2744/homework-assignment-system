
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateAssignmentCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  try {
    const teacher = getSession();
    if (!teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { teacher_id: teacher.id },
      include: {
        student_work: {
          select: {
            id: true,
            student_name: true,
            status: true,
            last_saved_at: true,
            submitted_at: true,
            word_count: true,
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Update session count
    const activeCount = assignments.filter(a => a.status === 'active').length;
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { active_sessions_count: activeCount }
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const teacher = getSession();
    if (!teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, instructions, deadline } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Check session limit
    const activeAssignments = await prisma.assignment.count({
      where: { 
        teacher_id: teacher.id,
        status: 'active'
      }
    });

    if (activeAssignments >= 3) {
      return NextResponse.json(
        { error: 'You have reached the maximum of 3 active assignments. Please close an existing assignment first.' },
        { status: 409 }
      );
    }

    let assignment_code = generateAssignmentCode();
    let attempts = 0;
    
    // Ensure unique code
    while (attempts < 10) {
      const existing = await prisma.assignment.findUnique({
        where: { assignment_code }
      });
      if (!existing) break;
      assignment_code = generateAssignmentCode();
      attempts++;
    }

    const assignment = await prisma.assignment.create({
      data: {
        teacher_id: teacher.id,
        title: title.substring(0, 100),
        content,
        instructions: instructions || null,
        assignment_code,
        deadline: deadline ? new Date(deadline) : null,
        status: 'active',
        activated_at: new Date(),
      }
    });

    // Update teacher's active session count
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { active_sessions_count: activeAssignments + 1 }
    });

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        assignment_code: assignment.assignment_code,
        status: assignment.status,
      }
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
