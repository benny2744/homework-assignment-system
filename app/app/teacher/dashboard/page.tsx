
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Download, 
  Play, 
  Pause, 
  Trash2,
  LogOut,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  assignment_code: string;
  status: string;
  created_at: string;
  activated_at?: string;
  closed_at?: string;
  student_count: number;
  max_students: number;
  student_work: Array<{
    id: string;
    student_name: string;
    status: string;
    last_saved_at: string;
    submitted_at?: string;
    word_count: number;
  }>;
}

export default function TeacherDashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const activeSessionsCount = assignments.filter(a => a.status === 'active').length;

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments');
      if (response.status === 401) {
        router.push('/teacher/login');
        return;
      }
      const data = await response.json();
      if (response.ok) {
        setAssignments(data.assignments);
      } else {
        setError(data.error || 'Failed to load assignments');
      }
    } catch (err) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleAssignmentStatus = async (assignmentId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'active' ? 'close' : 'reopen';
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (response.ok) {
        fetchAssignments();
      } else {
        setError(data.error || `Failed to ${action} assignment`);
      }
    } catch (err) {
      setError('Operation failed');
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? All student work will be permanently lost.')) {
      return;
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAssignments();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete assignment');
      }
    } catch (err) {
      setError('Failed to delete assignment');
    }
  };

  const downloadSubmissions = (assignmentId: string, type: string = 'bulk') => {
    window.open(`/api/assignments/${assignmentId}/download?type=${type}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Teacher Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={activeSessionsCount >= 3 ? "destructive" : "secondary"}>
                Sessions: {activeSessionsCount}/3
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Your Assignments</h2>
            <Link href="/teacher/create-assignment">
              <Button disabled={activeSessionsCount >= 3}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
                {activeSessionsCount >= 3 && " (Limit Reached)"}
              </Button>
            </Link>
          </div>

          {activeSessionsCount >= 3 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You've reached the maximum of 3 active assignments. Close an existing assignment to create a new one.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Assignments Grid */}
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-500 mb-6">Create your first assignment to get started</p>
              <Link href="/teacher/create-assignment">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {assignment.assignment_code}
                        </span>
                        <Badge variant={
                          assignment.status === 'active' ? 'default' :
                          assignment.status === 'closed' ? 'secondary' : 'outline'
                        }>
                          {assignment.status}
                        </Badge>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {assignment.student_count}/{assignment.max_students}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {assignment.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAssignmentStatus(assignment.id, assignment.status)}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Close
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAssignmentStatus(assignment.id, assignment.status)}
                          disabled={activeSessionsCount >= 3}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Reopen
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSubmissions(assignment.id)}
                        disabled={assignment.student_work.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAssignment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignment.student_work.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-3">Student Progress:</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {assignment.student_work.map((work) => (
                          <div key={work.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-sm">{work.student_name}</div>
                              <div className="text-xs text-gray-500">{work.word_count} words</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {work.status === 'submitted' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              )}
                              <Badge variant={work.status === 'submitted' ? 'default' : 'secondary'} className="text-xs">
                                {work.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No student submissions yet
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
