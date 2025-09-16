
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAssignmentCode } from '@/lib/utils';

export const dynamic = "force-dynamic";

// Get all assignments for authenticated teacher
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { teacher_id: session.user.id },
      include: {
        student_work: true,
        _count: {
          select: {
            student_work: {
              where: { status: 'final' }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const activeCount = assignments.filter(a => a.status === 'active').length;

    return NextResponse.json({ assignments, activeCount });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new assignment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check session limit
    const activeAssignments = await prisma.assignment.count({
      where: {
        teacher_id: session.user.id,
        status: 'active'
      }
    });

    if (activeAssignments >= 3) {
      return NextResponse.json(
        { error: 'You have reached the maximum limit of 3 active assignments. Please close an existing assignment before creating a new one.' },
        { status: 400 }
      );
    }

    const { title, content, instructions, deadline } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Generate unique assignment code
    let assignmentCode: string;
    let isUnique = false;
    do {
      assignmentCode = generateAssignmentCode();
      const existing = await prisma.assignment.findUnique({
        where: { assignment_code: assignmentCode }
      });
      isUnique = !existing;
    } while (!isUnique);

    const assignment = await prisma.assignment.create({
      data: {
        teacher_id: session.user.id,
        title: title.trim(),
        content: content.trim(),
        instructions: instructions?.trim() || null,
        assignment_code: assignmentCode,
        deadline: deadline ? new Date(deadline) : null,
        status: 'active',
        activated_at: new Date(),
      }
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
