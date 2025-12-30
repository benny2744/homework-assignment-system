
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { withBasePath } from '@/lib/base-path';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Download, 
  Settings, 
  LogOut, 
  Clock, 
  CheckCircle, 
  FileText,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  content: string;
  instructions?: string;
  assignment_code: string;
  status: string;
  created_at: string;
  deadline?: string;
  student_count: number;
  max_students: number;
  student_work: any[];
  _count: { student_work: number };
}

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    content: '',
    instructions: '',
    deadline: ''
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(withBasePath('/api/assignments'));
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments);
        setActiveCount(data.activeCount);
      }
    } catch (err) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newAssignment.title.trim() || !newAssignment.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const response = await fetch(withBasePath('/api/assignments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Assignment created! Code: ${data.assignment_code}`);
        setNewAssignment({ title: '', content: '', instructions: '', deadline: '' });
        setShowCreateForm(false);
        fetchAssignments();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create assignment');
    }
  };

  const updateAssignmentStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(withBasePath(`/api/assignments/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchAssignments();
        setSuccess(`Assignment ${status === 'active' ? 'activated' : 'closed'} successfully`);
      }
    } catch (err) {
      setError('Failed to update assignment');
    }
  };

  const deleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment? All student work will be lost.')) {
      return;
    }

    try {
      const response = await fetch(withBasePath(`/api/assignments/${id}`), { method: 'DELETE' });
      if (response.ok) {
        fetchAssignments();
        setSuccess('Assignment deleted successfully');
      }
    } catch (err) {
      setError('Failed to delete assignment');
    }
  };

  const downloadSubmissions = (assignmentId: number, type: string = 'all') => {
    window.open(withBasePath(`/api/assignments/${assignmentId}/download?type=${type}`), '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Homework System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.username}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6">
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Session Limit Status */}
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium">Active Assignments: </span>
                  <span className={`ml-2 font-bold ${
                    activeCount >= 3 ? 'text-red-600' : 
                    activeCount >= 2 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {activeCount}/3
                  </span>
                </div>
                <Button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  disabled={activeCount >= 3}
                  className={activeCount >= 3 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </div>
              {activeCount >= 3 && (
                <p className="text-sm text-red-600 mt-2">
                  You have reached the maximum limit of 3 active assignments. Please close an existing assignment before creating a new one.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Assignment Form */}
        {showCreateForm && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Create New Assignment</CardTitle>
                <CardDescription>
                  Create a secure assignment with copy protection and capacity management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createAssignment} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Assignment Title *
                    </label>
                    <Input
                      placeholder="Enter assignment title (5-100 characters)"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Assignment Content/Questions *
                    </label>
                    <Textarea
                      placeholder="Enter your assignment questions and instructions..."
                      value={newAssignment.content}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, content: e.target.value }))}
                      className="min-h-[200px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Student Instructions (Optional)
                    </label>
                    <Textarea
                      placeholder="Additional instructions for students..."
                      value={newAssignment.instructions}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Deadline (Optional)
                    </label>
                    <Input
                      type="datetime-local"
                      value={newAssignment.deadline}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Assignment</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assignments Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const finalSubmissions = assignment._count.student_work;
            const draftCount = assignment.student_work.filter(w => w.status === 'draft').length;
            
            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                      <CardDescription>
                        Code: <span className="font-mono font-semibold">{assignment.assignment_code}</span>
                      </CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      assignment.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status.toUpperCase()}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Student Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Student Capacity:</span>
                      <span className={`font-bold ${
                        assignment.student_count >= 25 ? 'text-red-600' : 
                        assignment.student_count >= 20 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {assignment.student_count}/{assignment.max_students}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                        <span>Final: {finalSubmissions}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-amber-600 mr-1" />
                        <span>Drafts: {draftCount}</span>
                      </div>
                    </div>
                  </div>

                  {assignment.deadline && (
                    <div className="text-sm text-gray-600">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Due: {new Date(assignment.deadline).toLocaleDateString()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {assignment.status === 'active' ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateAssignmentStatus(assignment.id, 'closed')}
                      >
                        <EyeOff className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateAssignmentStatus(assignment.id, 'active')}
                        disabled={activeCount >= 3}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadSubmissions(assignment.id)}
                      disabled={finalSubmissions === 0 && draftCount === 0}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteAssignment(assignment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {assignments.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-600 mb-6">Create your first assignment to get started</p>
              <Button onClick={() => setShowCreateForm(true)} disabled={activeCount >= 3}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Assignment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
