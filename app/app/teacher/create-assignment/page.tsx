
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, FileText, Calendar } from 'lucide-react';

export default function CreateAssignmentPage() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    instructions: '',
    deadline: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/teacher/dashboard');
      } else {
        setError(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFormData(prev => ({ ...prev, content }));
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/teacher/dashboard" className="flex items-center text-blue-600 hover:text-blue-500 mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl font-semibold">Create New Assignment</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>
                Create your assignment by entering the content manually or uploading a file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Assignment Title *
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Essay on Climate Change"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={100}
                    required
                    disabled={loading}
                  />
                  <div className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</div>
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-2">
                    Assignment Content *
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Upload File</span>
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".txt,.doc,.docx,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={loading}
                        />
                      </label>
                      <span className="text-sm text-gray-500">or</span>
                      <span className="text-sm text-gray-500">type/paste content below</span>
                    </div>
                    <Textarea
                      id="content"
                      placeholder="Enter your assignment question, prompt, or worksheet content here..."
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={10}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.content.length} characters
                  </div>
                </div>

                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium mb-2">
                    Additional Instructions (Optional)
                  </label>
                  <Textarea
                    id="instructions"
                    placeholder="Any special instructions for students (e.g., word count requirements, formatting guidelines, etc.)"
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium mb-2">
                    Deadline (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreview(!preview)}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {preview ? 'Hide Preview' : 'Preview'}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Assignment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle>Student View Preview</CardTitle>
                <CardDescription>
                  This is how students will see your assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-4">
                    {formData.title || 'Assignment Title'}
                  </h3>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Question/Prompt:</h4>
                    <div className="whitespace-pre-wrap text-blue-800">
                      {formData.content || 'Assignment content will appear here...'}
                    </div>
                  </div>

                  {formData.instructions && (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-yellow-900 mb-2">Instructions:</h4>
                      <div className="whitespace-pre-wrap text-yellow-800">
                        {formData.instructions}
                      </div>
                    </div>
                  )}

                  {formData.deadline && (
                    <div className="text-sm text-gray-600">
                      <strong>Deadline:</strong> {new Date(formData.deadline).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
