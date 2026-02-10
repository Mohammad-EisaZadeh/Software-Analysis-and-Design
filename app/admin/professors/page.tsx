'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { authApi, adminApi } from '@/lib/api';

export default function ProfessorsManagementPage() {
  const [professors, setProfessors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'professor',
    tenantId: 'tenant-1',
    department: '',
    status: 'active',
  });

  const fetchProfessors = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers('professor');
      if (Array.isArray(response.data)) {
        // Map the response to include department and status (defaults for now)
        const professorsWithExtras = response.data.map((prof: any) => ({
          ...prof,
          department: prof.department || 'Not specified',
          status: 'active', // Default status
        }));
        setProfessors(professorsWithExtras);
      } else if (response.error) {
        console.error('Error fetching professors:', response.error);
      }
    } catch (error) {
      console.error('Error fetching professors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  const filteredProfessors = professors.filter((professor: any) =>
    professor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingProfessor(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'professor',
      tenantId: 'tenant-1',
      department: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (professor: any) => {
    setEditingProfessor(professor);
    setFormData({ ...professor, password: '' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.password) {
        alert('Please fill in all required fields (Name, Email, Password)');
        return;
      }

      if (editingProfessor) {
        // Update professor - endpoint needs to be implemented
        alert('Update functionality needs backend endpoint');
      } else {
        // Create professor via registration
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
          alert('Professor created successfully!');
          setIsModalOpen(false);
          // Reset form
          setFormData({
            name: '',
            email: '',
            password: '',
            role: 'professor',
            tenantId: 'tenant-1',
            department: '',
            status: 'active',
          });
          // Refresh the professors list
          await fetchProfessors();
        }
      }
    } catch (error) {
      console.error('Error saving professor:', error);
      alert('Failed to save professor. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this professor?')) {
      // Delete endpoint needs to be implemented
      alert('Delete functionality needs backend endpoint');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Professors Management</h1>
          <p className="text-gray-600">Add, edit, and manage professor accounts</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Add Professor
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search professors..."
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
            <div className="text-gray-600">Loading professors...</div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Professors ({filteredProfessors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProfessors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No professors found. Add your first professor using the button above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessors.map((professor) => (
                <TableRow key={professor.id}>
                  <TableCell className="font-medium">{professor.name}</TableCell>
                  <TableCell>{professor.email}</TableCell>
                  <TableCell>{professor.department}</TableCell>
                  <TableCell>
                    <Badge variant={professor.status === 'active' ? 'success' : 'error'}>
                      {professor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(professor)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(professor.id)}>
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
        title={editingProfessor ? 'Edit Professor' : 'Add New Professor'}
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
            placeholder="Enter professor name"
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
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="Enter department"
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




