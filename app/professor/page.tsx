'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { elearningApi } from '@/lib/api';

export default function ProfessorDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await elearningApi.getExams();
        if (Array.isArray(response.data)) {
          setExams(response.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const assignedCourses = exams.length;
  const totalStudents = 0; // Would need students endpoint
  const pendingGrades = 0; // Would need grades endpoint
  const pendingObjections = 0; // Would need objections endpoint

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, Professor!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned Courses</p>
                <p className="text-2xl font-bold text-gray-900">{assignedCourses}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Grades</p>
                <p className="text-2xl font-bold text-gray-900">{pendingGrades}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Objections</p>
                <p className="text-2xl font-bold text-gray-900">{pendingObjections}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">My Courses</h3>
            <div className="space-y-3">
              {exams.length > 0 ? (
                exams.map((exam: any) => (
                  <div key={exam.id || Math.random()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{exam.title || 'Untitled Exam'}</p>
                      <p className="text-sm text-gray-600">{exam.questions_count || 0} questions</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/professor/exams`}>View</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No exams created yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/professor/grades">Enter Grades</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/professor/exams">Create Exam</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/professor/objections">Review Objections</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




