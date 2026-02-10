'use client';

import { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { elearningApi } from '@/lib/api';
import { calculateGPA } from '@/lib/utils';

export default function TranscriptPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // Note: Submissions endpoint may need to be added to backend
        // This fetches exams and their submissions
        const examsRes = await elearningApi.getExams();
        if (Array.isArray(examsRes.data)) {
          // For now, we'll show exam submissions if available
          setSubmissions([]);
        }
      } catch (error) {
        console.error('Error fetching transcript:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const gpa = submissions.length > 0 ? calculateGPA(submissions.map((s: any) => ({
    score: parseFloat(s.score || 0),
    maxScore: 100,
    credits: 3, // Default credits
  }))) : 0;

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transcript</h1>
        <p className="text-gray-600">View your academic performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current GPA</p>
                <p className="text-3xl font-bold text-gray-900">{gpa.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Credits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {submissions.length * 3}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Exams Completed</p>
                <p className="text-3xl font-bold text-gray-900">{submissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission: any) => {
                  const percentage = parseFloat(submission.score || 0);
                  const letter = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">Exam {submission.exam_id}</TableCell>
                      <TableCell>{percentage.toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge variant={percentage >= 90 ? 'success' : percentage >= 80 ? 'info' : percentage >= 70 ? 'warning' : 'error'}>
                          {letter}
                        </Badge>
                      </TableCell>
                      <TableCell>{submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-8">No exam results yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




