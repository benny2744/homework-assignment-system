
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  User,
  Hash,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface StudentSession {
  studentName: string;
  assignmentId: string;
  studentWorkId: string;
  isReturning: boolean;
  isSubmitted: boolean;
}

interface Assignment {
  id: string;
  title: string;
  content: string;
  instructions?: string;
}

interface StudentWork {
  id: string;
  content: string;
  word_count: number;
  status: string;
  submitted_at?: string;
}

export default function StudentAssignmentPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [studentWork, setStudentWork] = useState<StudentWork | null>(null);
  const [session, setSession] = useState<StudentSession | null>(null);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const router = useRouter();

  useEffect(() => {
    // Get session data from localStorage
    const sessionData = localStorage.getItem('student-session');
    if (!sessionData) {
      router.push('/student');
      return;
    }

    const parsedSession: StudentSession = JSON.parse(sessionData);
    setSession(parsedSession);

    // Fetch assignment and student work data
    fetchAssignmentData(parsedSession);

    // Set up copy protection
    setupCopyProtection();

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (content !== studentWork?.content) {
      // Auto-save every 30 seconds
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      
      autoSaveRef.current = setTimeout(() => {
        if (!submitting && studentWork?.status !== 'submitted') {
          handleSave(true); // Auto-save
        }
      }, 30000);
    }
  }, [content]);

  const renderMarkdown = (text: string) => {
    if (!text) return text;
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^## (.*$)/gim, '<h4 class="text-lg font-semibold mt-4 mb-2">$1</h4>')
      .replace(/^• (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\n/g, '<br>');
  };

  const fetchAssignmentData = async (sessionData: StudentSession) => {
    try {
      // Get assignment data from localStorage (stored by student access page)
      const storedAssignmentData = localStorage.getItem('current-assignment');
      if (storedAssignmentData) {
        const parsedData = JSON.parse(storedAssignmentData);
        setAssignment(parsedData.assignment);
        setStudentWork(parsedData.studentWork);
        setContent(parsedData.studentWork.content || '');
        setWordCount(parsedData.studentWork.word_count || 0);
      } else {
        // If no stored data, redirect back to student access
        setError('Assignment data not found. Redirecting to assignment access...');
        setTimeout(() => {
          router.push('/student');
        }, 2000);
      }
    } catch (err) {
      console.error('Error loading assignment data:', err);
      setError('Failed to load assignment data.');
    }
  };

  const setupCopyProtection = () => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable copy/paste shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'v', 'a', 's', 'p', 'x'].includes(e.key.toLowerCase())) {
          if (e.key.toLowerCase() !== 's') { // Allow Ctrl+S for our save function
            e.preventDefault();
            return false;
          }
        }
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection on question content
    const questionElements = document.querySelectorAll('.copy-protected');
    questionElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.userSelect = 'none';
      element.style.webkitUserSelect = 'none';
      (element.style as any).mozUserSelect = 'none';
      (element.style as any).msUserSelect = 'none';
    });

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Count words
    const words = newContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  const handleSave = async (isAutoSave = false) => {
    if (!studentWork || submitting) return;
    
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/student/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentWorkId: studentWork.id,
          content,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setStudentWork(data.studentWork);
        setLastSaved(new Date());
        if (!isAutoSave) {
          setSuccess('Work saved successfully!');
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        setError(data.error || 'Failed to save work');
      }
    } catch (err) {
      setError('Failed to save work');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!studentWork || submitting) return;

    const confirmSubmit = window.confirm(
      'Are you sure you want to submit your assignment? You will not be able to make any changes after submission.'
    );
    
    if (!confirmSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentWorkId: studentWork.id,
          content,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setStudentWork(data.studentWork);
        setSuccess('Assignment submitted successfully!');
        // Clear session data
        localStorage.removeItem('student-session');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/student');
        }, 3000);
      } else {
        setError(data.error || 'Failed to submit assignment');
      }
    } catch (err) {
      setError('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session || !assignment || !studentWork) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading assignment...</div>
      </div>
    );
  }

  const isSubmitted = studentWork.status === 'submitted';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/student" className="flex items-center text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit Assignment
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1" />
                {session.studentName}
              </div>
              <Badge variant={isSubmitted ? "default" : "secondary"}>
                {isSubmitted ? 'Submitted' : 'Draft'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {session.isReturning && !isSubmitted && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Welcome back! Your previous work has been loaded. Continue where you left off.
            </AlertDescription>
          </Alert>
        )}

        {/* Assignment Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="copy-protected bg-blue-50 p-6 rounded-lg mb-4">
              <h3 className="font-semibold text-blue-900 mb-3">Assignment Question:</h3>
              <div 
                className="text-blue-800 copy-protected"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(assignment.content)
                }}
              />
            </div>

            {assignment.instructions && (
              <div className="copy-protected bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Instructions:</h4>
                <div 
                  className="text-yellow-800 copy-protected"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(assignment.instructions)
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answer Area */}
        <Card>
          <CardHeader>
            <CardTitle>Your Answer</CardTitle>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>Word count: {wordCount}</div>
              {lastSaved && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div>
                <div className="bg-green-50 p-4 rounded-lg mb-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-900">Assignment Submitted</h3>
                  <p className="text-green-800 text-sm">
                    Submitted on: {new Date(studentWork.submitted_at!).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Your Submitted Answer:</h4>
                  <div className="whitespace-pre-wrap text-gray-800">
                    {content || '(No answer provided)'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Type your answer here... Your work will be automatically saved every 30 seconds."
                  className="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                />
                
                <div className="flex justify-between items-center">
                  <Button
                    onClick={() => handleSave(false)}
                    disabled={saving || submitting}
                    variant="outline"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit Final Answer'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
