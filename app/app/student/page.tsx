
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { withBasePath } from '@/lib/base-path';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, User, Hash, ArrowLeft, AlertCircle } from 'lucide-react';

export default function StudentAccessPage() {
  const [formData, setFormData] = useState({
    studentName: '',
    assignmentCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.studentName.trim() || !formData.assignmentCode.trim()) {
      setError('Please enter both your name and assignment code');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(withBasePath('/api/student/access'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store student session data
        localStorage.setItem('student-session', JSON.stringify({
          studentName: formData.studentName,
          assignmentId: data.assignment.id,
          studentWorkId: data.studentWork.id,
          isReturning: data.isReturning,
          isSubmitted: data.isSubmitted,
        }));
        
        // Store assignment and student work data for the assignment page
        localStorage.setItem('current-assignment', JSON.stringify({
          assignment: data.assignment,
          studentWork: data.studentWork,
          isReturning: data.isReturning,
          isSubmitted: data.isSubmitted,
        }));
        
        router.push('/student/assignment');
      } else {
        setError(data.error || 'Access denied');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-teal-600 hover:text-teal-500 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Student Access</h1>
          <p className="text-gray-600 mt-2">Enter your details to access your assignment</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Access Assignment</CardTitle>
            <CardDescription>
              Enter your name and the assignment code provided by your teacher
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="studentName" className="text-sm font-medium text-gray-700">
                  Your Name
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
                    maxLength={50}
                    pattern="[a-zA-Z\s]+"
                    title="Only letters and spaces are allowed"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Use the same name if you're returning to continue your work
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="assignmentCode" className="text-sm font-medium text-gray-700">
                  Assignment Code
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="assignmentCode"
                    type="text"
                    placeholder="Enter the 6-character code"
                    value={formData.assignmentCode}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      assignmentCode: e.target.value.toUpperCase() 
                    }))}
                    className="pl-10 font-mono"
                    required
                    disabled={loading}
                    maxLength={6}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  6-character code provided by your teacher (e.g., ABC123)
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading} size="lg">
                {loading ? 'Accessing Assignment...' : 'Access Assignment'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your work will be automatically saved as you type</li>
                <li>• You can leave and return to continue your work</li>
                <li>• Use the same name to access your previous work</li>
                <li>• Once submitted, you cannot make changes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
