'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { elearningApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await elearningApi.getExams();
        if (Array.isArray(response.data)) {
          setExams(response.data);
        }
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exams Schedule</h1>
        <p className="text-gray-600">View your upcoming and past exams</p>
      </div>

      <div className="space-y-6">
        {exams.map((exam: any) => (
          <Card key={exam.id} hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <CardTitle className="text-xl">{exam.title}</CardTitle>
                    <Badge variant="info">Exam</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={18} />
                      <span className="text-sm">{formatDate(exam.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={18} />
                      <span className="text-sm">{exam.duration} minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {exams.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No exams scheduled</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




