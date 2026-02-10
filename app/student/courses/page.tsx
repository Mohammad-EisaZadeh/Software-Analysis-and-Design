'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { coursesApi } from '@/lib/api';

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const [myCoursesRes, allCoursesRes] = await Promise.all([
          coursesApi.getMyCourses(),
          coursesApi.getCourses(),
        ]);

        if (Array.isArray(myCoursesRes.data)) {
          setCourses(myCoursesRes.data);
        }

        if (Array.isArray(allCoursesRes.data)) {
          // Filter out already enrolled courses
          const enrolledIds = Array.isArray(myCoursesRes.data) 
            ? myCoursesRes.data.map((c: any) => c.id)
            : [];
          const available = allCoursesRes.data.filter((c: any) => !enrolledIds.includes(c.id));
          setAvailableCourses(available);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course: any) =>
    course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">View and manage your enrolled courses</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Register Course
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: any) => (
              <Card key={course.id} hover>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{course.code}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{course.name}</p>
                    </div>
                    <Badge variant="success">Enrolled</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Professor:</span> {course.professor || 'TBA'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Credits:</span> {course.credits}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Semester:</span> {course.semester}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredCourses.length === 0 && !loading && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course: any) => (
                <Card key={course.id} hover>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.code}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{course.name}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium">Professor:</span> {course.professor || 'TBA'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Credits:</span> {course.credits}
                      </p>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await coursesApi.enrollInCourse(course.id);
                          if (response.error) {
                            alert(response.error);
                          } else {
                            alert('Successfully enrolled in course!');
                            window.location.reload();
                          }
                        } catch (error) {
                          alert('Failed to enroll in course');
                        }
                      }}
                    >
                      Register
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Course"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Select a course to register:</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableCourses.length > 0 ? (
              availableCourses.map((course: any) => (
                <div
                  key={course.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{course.code} - {course.name}</p>
                      <p className="text-sm text-gray-600">{course.professor || 'TBA'} - {course.credits} credits</p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await coursesApi.enrollInCourse(course.id);
                          if (response.error) {
                            alert(response.error);
                          } else {
                            alert('Successfully enrolled in course!');
                            setIsModalOpen(false);
                            // Refresh courses
                            window.location.reload();
                          }
                        } catch (error) {
                          alert('Failed to enroll in course');
                        }
                      }}
                    >
                      Register
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No available courses</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}





