'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Bell, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { elearningApi, notificationsApi } from '@/lib/api';

export default function StudentDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, notificationsRes] = await Promise.all([
          elearningApi.getExams(),
          notificationsApi.getNotifications(),
        ]);

        if (Array.isArray(examsRes.data)) {
          const upcoming = examsRes.data
            .filter((e: any) => e.start_time && new Date(e.start_time) > new Date())
            .slice(0, 2);
          setExams(upcoming);
        }

        if (Array.isArray(notificationsRes.data)) {
          setNotifications(notificationsRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const unreadNotifications = notifications.filter((n: any) => !n.read).length;
  const upcomingExams = exams;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
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
                <p className="text-sm text-gray-600 mb-1">Upcoming Exams</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingExams.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unread Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{unreadNotifications}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Bell className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current GPA</p>
                <p className="text-2xl font-bold text-gray-900">3.75</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam: any) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{exam.title}</p>
                      <p className="text-sm text-gray-600">{exam.start_time ? new Date(exam.start_time).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/student/exams">View</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming exams</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.slice(0, 3).length > 0 ? (
                notifications.slice(0, 3).map((notification: any) => (
                  <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-gray-300' : 'bg-blue-600'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">Notification</p>
                      <p className="text-xs text-gray-600">{notification.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No notifications</p>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link href="/student/notifications">View All</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




