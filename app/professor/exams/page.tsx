'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { elearningApi } from '@/lib/api';

export default function ExamManagementPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newExam, setNewExam] = useState({
    title: '',
    startTime: '',
    duration: 90,
    questions: [] as Array<{ text: string; options: string[]; correctOption: number }>,
  });

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

  const handleCreateExam = async () => {
    try {
      if (!newExam.title || !newExam.startTime || newExam.questions.length === 0) {
        alert('Please fill all fields and add at least one question');
        return;
      }

      const response = await elearningApi.createExam({
        title: newExam.title,
        startTime: newExam.startTime,
        duration: newExam.duration,
        questions: newExam.questions,
      });

      if (response.error) {
        alert(response.error);
      } else {
        alert('Exam created successfully!');
        setIsModalOpen(false);
        setNewExam({ title: '', startTime: '', duration: 90, questions: [] });
        // Refresh exams list
        window.location.reload();
      }
    } catch (error) {
      alert('Failed to create exam');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Management</h1>
          <p className="text-gray-600">Create and manage exams</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Create Exam
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam: any) => (
            <Card key={exam.id} hover>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <Badge variant="info" className="mt-2">Exam</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><span className="font-medium">Duration:</span> {exam.duration} minutes</p>
                  <p><span className="font-medium">Questions:</span> {exam.questions_count || 0}</p>
                  <p><span className="font-medium">Created:</span> {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {exams.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No exams created yet</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={20} className="mr-2" />
              Create Your First Exam
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Exam"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateExam}>Create Exam</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Exam Title"
            value={newExam.title}
            onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
            placeholder="e.g., Midterm Exam"
          />
          <Input
            label="Start Time"
            type="datetime-local"
            value={newExam.startTime}
            onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={newExam.duration}
            onChange={(e) => setNewExam({ ...newExam, duration: parseInt(e.target.value) || 90 })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Questions</label>
            <p className="text-sm text-gray-600 mb-2">Add questions in the exam details page after creation</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}




