
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { withBasePath } from '@/lib/base-path';
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
      const response = await fetch(withBasePath('/api/assignments'), {
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

  const renderMarkdown = (text: string) => {
    if (!text) return text;
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^## (.*$)/gim, '<h4 class="text-lg font-semibold mt-4 mb-2">$1</h4>')
      .replace(/^• (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\n/g, '<br>');
  };

  const handleContentFormat = (action: string) => {
    // Simple rich text formatting helpers
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let newText = '';
    switch (action) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'heading':
        newText = `## ${selectedText}`;
        break;
      case 'bullet':
        newText = `• ${selectedText}`;
        break;
      default:
        return;
    }

    const newContent = formData.content.substring(0, start) + newText + formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
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
                    <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md bg-gray-50">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleContentFormat('bold')}
                        disabled={loading}
                      >
                        <strong>B</strong>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleContentFormat('italic')}
                        disabled={loading}
                      >
                        <em>I</em>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleContentFormat('heading')}
                        disabled={loading}
                      >
                        H2
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleContentFormat('bullet')}
                        disabled={loading}
                      >
                        •
                      </Button>
                      <span className="text-xs text-gray-500 ml-auto">
                        Select text and click formatting buttons
                      </span>
                    </div>
                    <Textarea
                      id="content"
                      placeholder="Enter your assignment question, prompt, or worksheet content here...

Use formatting:
**Bold text**
*Italic text*
## Heading
• Bullet point

You can type directly or select text and use the formatting buttons above."
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={12}
                      required
                      disabled={loading}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.content.length} characters • Supports markdown-style formatting
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
                    <div 
                      className="text-blue-800"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(formData.content || 'Assignment content will appear here...')
                      }}
                    />
                  </div>

                  {formData.instructions && (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-yellow-900 mb-2">Instructions:</h4>
                      <div 
                        className="text-yellow-800"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(formData.instructions)
                        }}
                      />
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
