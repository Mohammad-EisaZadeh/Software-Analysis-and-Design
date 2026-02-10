'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Video, Link as LinkIcon, File } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { elearningApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function CourseMaterialsPage() {
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
        console.error('Error fetching materials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Note: Course materials endpoint not fully implemented in backend
  // This shows exams as placeholder - you may need to implement materials endpoint
  const materialsByCourse = exams.map(exam => ({
    course: { id: exam.id, code: 'EXAM', name: exam.title },
    materials: [] as any[],
  }));

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'error';
      case 'video':
        return 'info';
      case 'document':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Materials</h1>
        <p className="text-gray-600">Access educational files and resources</p>
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
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Icon className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{material.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getTypeColor(material.type) as any} className="text-xs">
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
                        <Button variant="outline" size="sm">
                          <Download size={16} className="mr-2" />
                          Download
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No materials available for this course</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}




