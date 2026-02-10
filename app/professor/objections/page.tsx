'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api';

type ObjectionStatus = 'pending' | 'resolved' | 'rejected';

interface Objection {
  id: string;
  courseName: string;
  studentName: string;
  studentId: string;
  message: string;
  status: ObjectionStatus;
  createdAt: Date;
  reply?: string;
}

// Note: Objections endpoint needs to be implemented in backend
// This is a placeholder until the endpoint is available
const placeholderObjections: Objection[] = [
  {
    id: '1',
    courseName: 'CS101',
    studentName: 'John Doe',
    studentId: 'STU2024001',
    message: 'I believe there was an error in grading my midterm exam. I should have received more points for question 3.',
    status: 'pending',
    createdAt: new Date('2024-11-10'),
  },
  {
    id: '2',
    courseName: 'MATH201',
    studentName: 'Jane Smith',
    studentId: 'STU2024002',
    message: 'Could you please review my assignment grade? I think I followed all the requirements.',
    status: 'pending',
    createdAt: new Date('2024-11-09'),
  },
  {
    id: '3',
    courseName: 'CS101',
    studentName: 'Bob Johnson',
    studentId: 'STU2024003',
    message: 'Thank you for reviewing my grade.',
    status: 'resolved',
    reply: 'I have reviewed your exam and adjusted the grade accordingly.',
    createdAt: new Date('2024-11-08'),
  },
];

export default function ObjectionsPage() {
  const [objections, setObjections] = useState<Objection[]>([]);
  const [selectedObjection, setSelectedObjection] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObjections = async () => {
      try {
        // Note: Objections endpoint needs to be implemented
        // For now, use placeholder data
        // const response = await apiClient.get('/objections');
        // if (response.data) {
        //   setObjections(response.data);
        // }
        setObjections(placeholderObjections);
      } catch (error) {
        console.error('Error fetching objections:', error);
        setObjections(placeholderObjections);
      } finally {
        setLoading(false);
      }
    };

    fetchObjections();
  }, []);

  const selected = objections.find(o => o.id === selectedObjection);

  const handleReply = async () => {
    if (!selectedObjection) return;
    try {
      // Note: Objections reply endpoint needs to be implemented
      // await apiClient.put(`/objections/${selectedObjection}/reply`, { reply });
      setObjections(objections.map(o => 
        o.id === selectedObjection 
          ? { ...o, status: 'resolved' as ObjectionStatus, reply }
          : o
      ));
      setSelectedObjection(null);
      setReply('');
    } catch (error) {
      alert('Failed to submit reply');
    }
  };

  const handleReject = async (id: string) => {
    try {
      // Note: Objections reject endpoint needs to be implemented
      // await apiClient.put(`/objections/${id}/reject`);
      setObjections(objections.map(o => 
        o.id === id ? { ...o, status: 'rejected' as ObjectionStatus } : o
      ));
    } catch (error) {
      alert('Failed to reject objection');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Objections</h1>
        <p className="text-gray-600">Review and respond to grade objections</p>
      </div>

      <div className="space-y-4">
        {objections.map((objection) => (
          <Card key={objection.id} hover>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{objection.courseName}</h3>
                    <Badge variant={getStatusColor(objection.status) as any} className="capitalize">
                      {objection.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">{objection.studentName}</span> ({objection.studentId})
                  </p>
                  <p className="text-gray-700 mb-3">{objection.message}</p>
                  {objection.reply && (
                    <div className="p-3 bg-blue-50 rounded-lg mt-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">Your Reply:</p>
                      <p className="text-sm text-blue-800">{objection.reply}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">{formatDateTime(objection.createdAt)}</p>
                </div>
                {objection.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedObjection(objection.id)}
                    >
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(objection.id)}
                    >
                      <X size={16} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {objections.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No objections</p>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={selectedObjection !== null}
        onClose={() => {
          setSelectedObjection(null);
          setReply('');
        }}
        title={`Reply to ${selected?.studentName}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setSelectedObjection(null);
              setReply('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleReply}>
              <Check size={18} className="mr-2" />
              Send Reply
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Student's Message:</p>
              <p className="text-sm text-gray-600">{selected.message}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Reply</label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-university focus:border-transparent"
                rows={4}
                placeholder="Enter your reply..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}




