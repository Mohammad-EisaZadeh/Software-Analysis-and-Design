'use client';

import { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { elearningApi } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalProfessors: 0,
    totalCourses: 0,
    activeSemesters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Note: Stats endpoints need to be implemented
        // For now, fetch exams as placeholder
        const examsRes = await elearningApi.getExams();
        const examsCount = Array.isArray(examsRes.data) ? examsRes.data.length : 0;
        setStats({
          totalStudents: 0,
          totalProfessors: 0,
          totalCourses: examsCount,
          activeSemesters: 1,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage the university system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents || '-'}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Professors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProfessors || '-'}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses || '-'}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Semesters</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSemesters || '-'}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Settings className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Students Management</h3>
              <Users className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-600 text-sm mb-4">Add, edit, and manage student accounts</p>
            <Button className="w-full" asChild>
              <Link href="/admin/students">Manage Students</Link>
            </Button>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Professors Management</h3>
              <GraduationCap className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-600 text-sm mb-4">Add, edit, and manage professor accounts</p>
            <Button className="w-full" asChild>
              <Link href="/admin/professors">Manage Professors</Link>
            </Button>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Courses Management</h3>
              <BookOpen className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-600 text-sm mb-4">Create and manage courses, assign professors</p>
            <Button className="w-full" asChild>
              <Link href="/admin/courses">Manage Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




