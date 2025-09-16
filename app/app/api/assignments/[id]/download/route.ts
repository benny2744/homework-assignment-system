
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import JSZip from 'jszip';

export const dynamic = "force-dynamic";

// Download assignment submissions
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentId = parseInt(params.id);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'drafts', 'finals', 'individual'
    const studentName = searchParams.get('student');

    // Verify ownership
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        teacher_id: session.user.id
      },
      include: {
        student_work: {
          orderBy: [{ student_name: 'asc' }, { status: 'desc' }]
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Filter work based on type
    let workToDownload = assignment.student_work;
    
    if (type === 'drafts') {
      workToDownload = workToDownload.filter(w => w.status === 'draft');
    } else if (type === 'finals') {
      workToDownload = workToDownload.filter(w => w.status === 'final');
    }
    
    if (studentName) {
      workToDownload = workToDownload.filter(w => w.student_name === studentName);
    }

    if (workToDownload.length === 0) {
      return NextResponse.json({ error: 'No submissions found' }, { status: 404 });
    }

    // Generate file content
    const generateFileContent = (work: any) => {
      const status = work.status.toUpperCase();
      const timestamp = work.status === 'final' 
        ? work.submitted_at 
        : work.last_saved_at;
      
      return `=====================================
HOMEWORK ${status === 'FINAL' ? 'SUBMISSION - FINAL' : 'DRAFT'}
=====================================

Assignment Title: ${assignment.title}
Student Name: ${work.student_name}
${status === 'FINAL' ? 'Final Submission:' : 'Draft Saved:'} ${formatDateTime(timestamp)}
Word Count: ${work.word_count || 0}
Status: ${status}${status === 'DRAFT' ? ' - NOT FINAL SUBMISSION' : ''}
Assignment Capacity: ${assignment.student_count}/${assignment.max_students} students

-------------------------------------
ASSIGNMENT QUESTION:
-------------------------------------
${assignment.content}

${assignment.instructions ? `
-------------------------------------
INSTRUCTIONS:
-------------------------------------
${assignment.instructions}
` : ''}
-------------------------------------
STUDENT ANSWER${status === 'DRAFT' ? ' (DRAFT)' : ''}:
-------------------------------------
${work.content}

=====================================
End of ${status === 'FINAL' ? 'Final Submission' : 'Draft'}
=====================================`;
    };

    // Single file download
    if (workToDownload.length === 1) {
      const work = workToDownload[0];
      const content = generateFileContent(work);
      const fileName = `${work.student_name}_${formatDateTime(work.last_saved_at || new Date()).replace(/[^\w]/g, '-')}_${work.status.toUpperCase()}.txt`;
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    }

    // Multiple files - create ZIP
    const zip = new JSZip();
    
    // Create folders
    const finalFolder = zip.folder('Final_Submissions');
    const draftFolder = zip.folder('Draft_Submissions');
    
    // Add files to appropriate folders
    workToDownload.forEach(work => {
      const content = generateFileContent(work);
      const fileName = `${work.student_name}_${formatDateTime(work.last_saved_at || new Date()).replace(/[^\w]/g, '-')}_${work.status.toUpperCase()}.txt`;
      
      if (work.status === 'final') {
        finalFolder?.file(fileName, content);
      } else {
        draftFolder?.file(fileName, content);
      }
    });

    // Create summary file
    const finalCount = workToDownload.filter(w => w.status === 'final').length;
    const draftCount = workToDownload.filter(w => w.status === 'draft').length;
    const uniqueStudents = new Set(workToDownload.map(w => w.student_name)).size;

    const summaryContent = `SUBMISSION SUMMARY
Assignment: ${assignment.title}
Total Students: ${uniqueStudents}
Final Submissions: ${finalCount}
Draft Only: ${draftCount}
Assignment Capacity: ${assignment.student_count}/${assignment.max_students} students
Download Date: ${formatDateTime(new Date())}

STUDENT STATUS:
${workToDownload.map((work, index) => 
  `${index + 1}. ${work.student_name} - ${work.status.toUpperCase()} - ${formatDateTime(work.status === 'final' ? (work.submitted_at || new Date()) : (work.last_saved_at || new Date()))} - ${work.word_count || 0} words`
).join('\n')}

CAPACITY METRICS:
Current Students: ${assignment.student_count}
Available Slots: ${assignment.max_students - assignment.student_count}
Capacity Utilization: ${Math.round((assignment.student_count / assignment.max_students) * 100)}%
`;

    zip.file('submission_summary.txt', summaryContent);

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFileName = `${assignment.title.replace(/[^\w]/g, '-')}_Submissions_${new Date().toISOString().split('T')[0]}.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`
      }
    });

  } catch (error) {
    console.error('Error downloading submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
