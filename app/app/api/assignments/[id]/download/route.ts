
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';
import JSZip from 'jszip';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacher = getSession();
    if (!teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentId = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, drafts, submitted, bulk
    const studentName = searchParams.get('student');

    const assignment = await prisma.assignment.findFirst({
      where: { 
        id: assignmentId,
        teacher_id: teacher.id 
      },
      include: {
        student_work: {
          orderBy: { student_name: 'asc' }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Filter student work based on type
    let studentWork = assignment.student_work;
    if (type === 'drafts') {
      studentWork = studentWork.filter(work => work.status === 'draft');
    } else if (type === 'submitted') {
      studentWork = studentWork.filter(work => work.status === 'submitted');
    }

    // Single student download
    if (studentName) {
      const work = studentWork.find(w => w.student_name === studentName);
      if (!work) {
        return NextResponse.json({ error: 'Student work not found' }, { status: 404 });
      }

      const content = createSubmissionFile(assignment, work);
      // Sanitize filename for cross-platform compatibility
      const sanitizedName = work.student_name.replace(/[^a-zA-Z0-9_\-\s]/g, '');
      const filename = `${sanitizedName}_${formatDate(work.last_saved_at)}_${work.status.toUpperCase()}.txt`;
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Bulk download as ZIP
    if (type === 'bulk' || studentWork.length > 1) {
      try {
        const zip = new JSZip();
        
        for (const work of studentWork) {
          const content = createSubmissionFile(assignment, work);
          // Sanitize filename for cross-platform compatibility
          const sanitizedName = work.student_name.replace(/[^a-zA-Z0-9_\-\s]/g, '');
          const filename = `${sanitizedName}_${formatDate(work.last_saved_at)}_${work.status.toUpperCase()}.txt`;
          zip.file(filename, content);
        }

        const zipContent = await zip.generateAsync({ 
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });
        
        // Sanitize zip filename 
        const sanitizedTitle = assignment.title.replace(/[^a-zA-Z0-9_\-\s]/g, '');
        const zipFilename = `${sanitizedTitle}_submissions_${formatDate(new Date())}.zip`;

        return new NextResponse(zipContent, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${zipFilename}"`,
            'Content-Length': zipContent.length.toString(),
          },
        });
      } catch (zipError) {
        console.error('ZIP creation error:', zipError);
        return NextResponse.json({ error: 'Failed to create ZIP file' }, { status: 500 });
      }
    }

    // Single file download for single submission
    if (studentWork.length === 1) {
      const work = studentWork[0];
      const content = createSubmissionFile(assignment, work);
      // Sanitize filename for cross-platform compatibility
      const sanitizedName = work.student_name.replace(/[^a-zA-Z0-9_\-\s]/g, '');
      const filename = `${sanitizedName}_${formatDate(work.last_saved_at)}_${work.status.toUpperCase()}.txt`;
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: 'No submissions found' }, { status: 404 });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function markdownToPlainText(text: string): string {
  if (!text) return text;
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic formatting  
    .replace(/^## (.*$)/gim, '$1')   // Remove heading formatting
    .replace(/^• (.*$)/gim, '• $1')  // Keep bullet points as is
    .replace(/\n/g, '\n');           // Keep line breaks
}

function createSubmissionFile(assignment: any, work: any): string {
  const header = `HOMEWORK ASSIGNMENT SUBMISSION
${'='.repeat(50)}

Assignment: ${assignment.title}
Student: ${work.student_name}
Status: ${work.status.toUpperCase()}
Word Count: ${work.word_count}
Last Saved: ${formatDate(work.last_saved_at)}
${work.submitted_at ? `Submitted: ${formatDate(work.submitted_at)}` : ''}

${'='.repeat(50)}
QUESTION/PROMPT:
${'='.repeat(50)}

${markdownToPlainText(assignment.content)}

${assignment.instructions ? `
${'='.repeat(50)}
INSTRUCTIONS:
${'='.repeat(50)}

${markdownToPlainText(assignment.instructions)}
` : ''}

${'='.repeat(50)}
STUDENT ANSWER:
${'='.repeat(50)}

${work.content || '(No answer provided)'}

${'='.repeat(50)}
END OF SUBMISSION
${'='.repeat(50)}
`;

  return header;
}

function formatDate(date: Date): string {
  return new Date(date).toISOString().split('T')[0] + '_' + 
         new Date(date).toTimeString().split(' ')[0].replace(/:/g, '-');
}
