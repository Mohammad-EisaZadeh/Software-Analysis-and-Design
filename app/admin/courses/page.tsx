'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Search, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { coursesApi, adminApi } from '@/lib/api';

export default function CoursesManagementPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    professorId: '',
    credits: 3,
    semester: 'Fall 2024',
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [coursesRes, professorsRes] = await Promise.all([
        coursesApi.getCourses(),
        adminApi.getUsers('professor'),
      ]);

      if (Array.isArray(coursesRes.data)) {
        // Map courses with professor names
        const coursesWithProfessors = coursesRes.data.map((course: any) => {
          const professor = Array.isArray(professorsRes.data) 
            ? professorsRes.data.find((p: any) => p.id === course.professorId)
            : null;
          return {
            ...course,
            professor: professor?.name || null,
          };
        });
        setCourses(coursesWithProfessors);
      }

      if (Array.isArray(professorsRes.data)) {
        setProfessors(professorsRes.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course: any) =>
    course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingCourse(null);
    setFormData({ code: '', name: '', professorId: '', credits: 3, semester: 'Fall 2024' });
    setIsModalOpen(true);
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      code: course.code || '',
      name: course.name || '',
      professorId: course.professorId || '',
      credits: course.credits || 3,
      semester: course.semester || 'Fall 2024',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.code || !formData.name) {
        alert('Please fill in all required fields (Code, Name)');
        return;
      }

      if (editingCourse) {
        const response = await coursesApi.updateCourse(editingCourse.id, {
          code: formData.code,
          name: formData.name,
          professorId: formData.professorId ? parseInt(formData.professorId) : undefined,
          credits: formData.credits,
          semester: formData.semester,
        });

        if (response.error) {
          alert(response.error);
        } else {
          alert('Course updated successfully!');
          setIsModalOpen(false);
          await fetchCourses();
        }
      } else {
        const response = await coursesApi.createCourse({
          code: formData.code,
          name: formData.name,
          professorId: formData.professorId ? parseInt(formData.professorId) : undefined,
          credits: formData.credits,
          semester: formData.semester,
        });

        if (response.error) {
          alert(response.error);
        } else {
          alert('Course created successfully!');
          setIsModalOpen(false);
          setFormData({ code: '', name: '', professorId: '', credits: 3, semester: 'Fall 2024' });
          await fetchCourses();
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await coursesApi.deleteCourse(parseInt(id));
        if (response.error) {
          alert(response.error);
        } else {
          alert('Course deleted successfully!');
          await fetchCourses();
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course. Please try again.');
      }
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses Management</h1>
          <p className="text-gray-600">Create and manage courses, assign professors</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Add Course
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-600">Loading courses...</div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Courses ({filteredCourses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No courses found. Add your first course using the button above.
              </div>
            ) : (
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>
                    {course.professor ? (
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span>{course.professor}</span>
                      </div>
                    ) : (
                      <Badge variant="warning">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(course)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(course.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Course Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., CS101"
            />
            <Input
              label="Credits"
              type="number"
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
            />
          </div>
          <Input
            label="Course Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter course name"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Professor</label>
            <select
              value={formData.professorId}
              onChange={(e) => setFormData({ ...formData, professorId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-university focus:border-transparent"
            >
              <option value="">Select a professor</option>
              {professors.map((professor: any) => (
                <option key={professor.id} value={professor.id}>{professor.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-university focus:border-transparent"
            >
              <option value="Fall 2024">Fall 2024</option>
              <option value="Spring 2025">Spring 2025</option>
              <option value="Summer 2025">Summer 2025</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}




