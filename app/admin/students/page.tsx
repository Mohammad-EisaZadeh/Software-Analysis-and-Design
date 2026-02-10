'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { authApi, adminApi } from '@/lib/api';

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    tenantId: 'tenant-1',
    studentId: '',
    status: 'active',
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers('student');
      if (Array.isArray(response.data)) {
        // Map the response to include studentId and status (defaults for now)
        const studentsWithExtras = response.data.map((student: any) => ({
          ...student,
          studentId: student.studentId || `STU${student.id}`,
          status: 'active', // Default status
        }));
        setStudents(studentsWithExtras);
      } else if (response.error) {
        console.error('Error fetching students:', response.error);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student: any) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      tenantId: 'tenant-1',
      studentId: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({ ...student, password: '' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.password) {
        alert('Please fill in all required fields (Name, Email, Password)');
        return;
      }

      if (editingStudent) {
        // Update user - endpoint needs to be implemented
        alert('Update functionality needs backend endpoint');
      } else {
        // Create user via registration
        // Only send fields required by backend
        const registrationData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          tenantId: formData.tenantId,
        };

        const response = await authApi.register(registrationData);
        if (response.error) {
          alert(response.error);
        } else {
          alert('Student created successfully!');
          setIsModalOpen(false);
          // Reset form
          setFormData({
            name: '',
            email: '',
            password: '',
            role: 'student',
            tenantId: 'tenant-1',
            studentId: '',
            status: 'active',
          });
          // Refresh the students list
          await fetchStudents();
        }
      }
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Failed to save student. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      // Delete endpoint needs to be implemented
      alert('Delete functionality needs backend endpoint');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Students Management</h1>
          <p className="text-gray-600">Add, edit, and manage student accounts</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Add Student
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.studentId}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'success' : 'error'}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(student.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter student name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
            required
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password"
            required
          />
          <Input
            label="Student ID"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            placeholder="Enter student ID (optional)"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-university focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}




