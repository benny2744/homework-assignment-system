
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/base-path';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, User, Key, AlertTriangle, Users } from 'lucide-react';

export default function StudentAccess() {
  const [formData, setFormData] = useState({ studentName: '', assignmentCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(withBasePath('/api/student/access'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store assignment data and student info in sessionStorage
        sessionStorage.setItem('studentAssignmentData', JSON.stringify({
          assignment: data.assignment,
          studentName: formData.studentName.trim(),
          existingDraft: data.existingDraft,
          studentCount: data.studentCount,
          maxStudents: data.maxStudents
        }));
        
        router.push('/student/assignment');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to access assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Student Assignment</h1>
          <p className="text-gray-600 mt-2">Enter your details to access your assignment</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Assignment Access</CardTitle>
            <CardDescription>
              Enter your name and the assignment code provided by your teacher
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant={error.includes('capacity') ? 'destructive' : 'destructive'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="studentName" className="text-sm font-medium text-gray-700">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="studentName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.studentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                    className="pl-10"
                    required
                    disabled={loading}
                    pattern="[a-zA-Z\s]{2,50}"
                    title="Use only letters and spaces (2-50 characters)"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Use the same name if you've worked on this assignment before
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="assignmentCode" className="text-sm font-medium text-gray-700">
                  Assignment Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="assignmentCode"
                    type="text"
                    placeholder="Enter 6-character code"
                    value={formData.assignmentCode}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      assignmentCode: e.target.value.toUpperCase() 
                    }))}
                    className="pl-10 font-mono"
                    required
                    disabled={loading}
                    maxLength={6}
                    pattern="[A-Z0-9]{6}"
                    title="Assignment code should be 6 characters (letters and numbers)"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  This code was provided by your teacher
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Accessing Assignment...' : 'Access Assignment'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">Assignment Guidelines</span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Maximum 30 students per assignment</li>
              <li>• You can save drafts and continue later</li>
              <li>• Copy-paste is disabled for security</li>
              <li>• Make sure to submit your final work</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Teacher Login
          </Button>
        </div>
      </div>
    </div>
  );
}
