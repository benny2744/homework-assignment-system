
import Link from 'next/link';
import { BookOpen, Users, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Homework System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/teacher/login">
                <Button variant="outline">Teacher Login</Button>
              </Link>
              <Link href="/student">
                <Button>Student Access</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Secure Homework Assignment System
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive platform designed for educators to create, distribute, and collect 
            homework assignments with advanced copy-protection and academic integrity features.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Copy Protection</CardTitle>
              <CardDescription>
                Advanced security measures prevent copying and pasting to ensure academic integrity
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-green-600 mb-4" />
              <CardTitle>Draft Saving</CardTitle>
              <CardDescription>
                Students can save their work and return to continue, preventing data loss
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-4" />
              <CardTitle>Easy Access</CardTitle>
              <CardDescription>
                Simple assignment codes allow students to access work without complex accounts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-orange-600 mb-4" />
              <CardTitle>Bulk Download</CardTitle>
              <CardDescription>
                Teachers can download all submissions in organized formats for efficient grading
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Teachers</h3>
              <p className="text-gray-600 mb-6">
                Create secure assignments, manage submissions, and maintain academic integrity 
                with our comprehensive teacher dashboard.
              </p>
              <div className="space-y-3">
                <Link href="/teacher/register">
                  <Button className="w-full" size="lg">
                    Create Teacher Account
                  </Button>
                </Link>
                <Link href="/teacher/login">
                  <Button variant="outline" className="w-full" size="lg">
                    Teacher Login
                  </Button>
                </Link>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Students</h3>
              <p className="text-gray-600 mb-6">
                Access your assignments using the code provided by your teacher. 
                No account registration required.
              </p>
              <Link href="/student">
                <Button className="w-full" size="lg">
                  Access Assignment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Homework Assignment System. Built for academic integrity.</p>
        </div>
      </footer>
    </div>
  );
}
