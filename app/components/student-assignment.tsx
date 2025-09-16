
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Save, 
  Send, 
  Clock, 
  FileText, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Eye,
  ArrowLeft
} from 'lucide-react';

interface AssignmentData {
  assignment: {
    id: number;
    title: string;
    content: string;
    instructions?: string;
    deadline?: string;
  };
  studentName: string;
  existingDraft?: {
    content: string;
    lastSaved: string;
    wordCount: number;
  };
  studentCount: number;
  maxStudents: number;
}

export default function StudentAssignment() {
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sessionToken, setSessionToken] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const autoSaveInterval = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load assignment data from sessionStorage
    const storedData = sessionStorage.getItem('studentAssignmentData');
    if (!storedData) {
      router.push('/student');
      return;
    }

    const data: AssignmentData = JSON.parse(storedData);
    setAssignmentData(data);
    
    // Load existing draft if available
    if (data.existingDraft) {
      setStudentAnswer(data.existingDraft.content);
      setWordCount(data.existingDraft.wordCount);
      setLastSaved(new Date(data.existingDraft.lastSaved));
    }

    // Generate session token
    setSessionToken(Math.random().toString(36).substring(2) + Date.now().toString(36));

    // Set up copy protection
    setupCopyProtection();
    
    // Set up auto-save
    autoSaveInterval.current = setInterval(() => {
      if (studentAnswer.trim()) {
        autoSave();
      }
    }, 30000); // Every 30 seconds

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
      removeCopyProtection();
    };
  }, []);

  const setupCopyProtection = () => {
    // Disable right-click context menu
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+A, Ctrl+V, Ctrl+X, F12, Ctrl+Shift+I
      if (
        (e.ctrlKey && ['c', 'a', 'v', 'x'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent selection on question content
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.protected-content')) {
        e.preventDefault();
        return false;
      }
    };

    // Block drag and drop
    const handleDragStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    // Store references for cleanup
    window.copyProtectionHandlers = {
      handleContextMenu,
      handleKeyDown,
      handleSelectStart,
      handleDragStart
    };
  };

  const removeCopyProtection = () => {
    const handlers = (window as any).copyProtectionHandlers;
    if (handlers) {
      document.removeEventListener('contextmenu', handlers.handleContextMenu);
      document.removeEventListener('keydown', handlers.handleKeyDown);
      document.removeEventListener('selectstart', handlers.handleSelectStart);
      document.removeEventListener('dragstart', handlers.handleDragStart);
    }
  };

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setStudentAnswer(text);
    setWordCount(countWords(text));
  };

  const autoSave = async () => {
    if (!assignmentData || submitted || autoSaving) return;

    setAutoSaving(true);
    try {
      const response = await fetch('/api/student/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignmentData.assignment.id,
          studentName: assignmentData.studentName,
          content: studentAnswer,
          sessionToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLastSaved(new Date(data.savedAt));
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!assignmentData || submitted) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/student/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignmentData.assignment.id,
          studentName: assignmentData.studentName,
          content: studentAnswer,
          sessionToken
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setLastSaved(new Date(data.savedAt));
        setSuccess('Draft saved successfully! You can return to continue your work.');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save draft. Please try again.');
    }
  };

  const handleSubmitFinal = async () => {
    if (!assignmentData || submitted) return;

    if (!studentAnswer.trim()) {
      setError('Please write your answer before submitting.');
      return;
    }

    if (!confirm('Are you sure you want to submit your final answer? You won\'t be able to edit it after submission.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignmentData.assignment.id,
          studentName: assignmentData.studentName,
          content: studentAnswer
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        setSuccess(`Assignment submitted successfully! Submission time: ${new Date(data.submittedAt).toLocaleString()}`);
        // Clear interval
        if (autoSaveInterval.current) {
          clearInterval(autoSaveInterval.current);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit assignment. Please try again.');
    }
  };

  if (!assignmentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading assignment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 no-context-menu no-select no-drag">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-green-600 mr-3" />
              <h1 className="text-lg font-semibold text-gray-900">Student Assignment</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {assignmentData.studentName}
              </span>
              {!submitted && (
                <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Exit
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Assignment Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium">Word Count</p>
                  <p className="text-2xl font-bold">{wordCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium">Students</p>
                  <p className="text-2xl font-bold">{assignmentData.studentCount}/{assignmentData.maxStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-amber-600 mr-2" />
                <div>
                  <p className="text-sm font-medium">Last Saved</p>
                  <p className="text-sm font-bold">
                    {lastSaved ? lastSaved.toLocaleTimeString() : 'Not saved'}
                    {autoSaving && <span className="text-blue-600 ml-2">(Saving...)</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="protected-content no-select">
              {assignmentData.assignment.title}
            </CardTitle>
            {assignmentData.assignment.deadline && (
              <CardDescription>
                <Clock className="h-4 w-4 inline mr-1" />
                Due: {new Date(assignmentData.assignment.deadline).toLocaleString()}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="protected-content no-select mb-4">
              <h3 className="font-semibold mb-2">Assignment Questions:</h3>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {assignmentData.assignment.content}
              </div>
            </div>
            
            {assignmentData.assignment.instructions && (
              <div className="protected-content no-select mb-4">
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <div className="bg-blue-50 p-4 rounded-lg whitespace-pre-wrap">
                  {assignmentData.assignment.instructions}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answer Area */}
        {!submitted ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Answer</CardTitle>
              <CardDescription>
                Type your response below. Your work is automatically saved every 30 seconds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                ref={textareaRef}
                placeholder="Start typing your answer here..."
                value={studentAnswer}
                onChange={handleAnswerChange}
                className="min-h-[400px] resize-none"
                onContextMenu={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Words: {wordCount}</span>
                  {lastSaved && (
                    <span>Last saved: {lastSaved.toLocaleString()}</span>
                  )}
                  {autoSaving && (
                    <span className="text-blue-600 save-indicator">Auto-saving...</span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={handleSaveDraft}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={handleSubmitFinal} className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Final
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">Assignment Submitted!</h3>
              <p className="text-gray-600 mb-4">
                Your assignment has been successfully submitted and cannot be edited.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Submission Details:</h4>
                <p className="text-sm">Student: {assignmentData.studentName}</p>
                <p className="text-sm">Assignment: {assignmentData.assignment.title}</p>
                <p className="text-sm">Word Count: {wordCount}</p>
                <p className="text-sm">Status: Final Submission</p>
              </div>
              
              <div className="mt-6">
                <Button onClick={() => router.push('/student')}>
                  Access Another Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
