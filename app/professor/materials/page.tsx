'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Video, Link as LinkIcon, File, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { elearningApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function CourseMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'pdf' as 'pdf' | 'video' | 'document' | 'link',
    url: '',
  });

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await elearningApi.getExams();
        if (Array.isArray(response.data) && response.data.length > 0) {
          setExams(response.data);
          setSelectedCourse(response.data[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching exams:', error);
      }
    };

    fetchExams();
  }, []);

  // Note: Course materials endpoint needs to be implemented
  const materialsByCourse = Array.isArray(exams) ? exams.map((exam: any) => ({
    course: { id: exam.id, code: 'EXAM', name: exam.title || 'Untitled' },
    materials: [] as any[],
  })) : [];

  const handleUpload = async () => {
    try {
      // Note: Material upload endpoint needs to be implemented
      alert('Material upload endpoint needs to be implemented in backend');
      setIsUploadModalOpen(false);
      setNewMaterial({ title: '', type: 'pdf', url: '' });
    } catch (error) {
      alert('Failed to upload material');
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return FileText;
      case 'video':
        return Video;
      case 'link':
        return LinkIcon;
      default:
        return File;
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Materials</h1>
          <p className="text-gray-600">Upload and manage educational files</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Upload size={20} className="mr-2" />
          Upload Material
        </Button>
      </div>

      <div className="space-y-6">
        {materialsByCourse.map(({ course, materials }) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>{course.code} - {course.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.map((material) => {
                    const Icon = getMaterialIcon(material.type);
                    return (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Icon className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{material.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="info" className="text-xs">
                                {material.type.toUpperCase()}
                              </Badge>
                              {material.size && (
                                <span className="text-xs text-gray-500">{material.size}</span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDate(material.uploadedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No materials uploaded for this course</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Course Material"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload}>Upload</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-university focus:border-transparent"
            >
              {exams.map((exam: any) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Material Title"
            value={newMaterial.title}
            onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
            placeholder="e.g., Lecture 1 Slides"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <select
              value={newMaterial.type}
              onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-university focus:border-transparent"
            >
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="link">Link</option>
            </select>
          </div>
          <Input
            label="File URL or Upload"
            value={newMaterial.url}
            onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
            placeholder="Enter file URL or select file to upload"
          />
        </div>
      </Modal>
    </div>
  );
}




