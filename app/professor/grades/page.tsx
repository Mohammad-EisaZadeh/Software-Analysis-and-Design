'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { elearningApi } from '@/lib/api';

export default function GradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState('midterm');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await elearningApi.getExams();
        if (Array.isArray(response.data) && response.data.length > 0) {
          setExams(response.data);
          setSelectedCourse(response.data[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Note: Grades/submissions endpoint would need to be added to backend
  // This is a placeholder for the grades interface

  const handleScoreChange = (id: string, value: string) => {
    setGrades(grades.map(grade => 
      grade.id === id ? { ...grade, score: parseInt(value) || 0 } : grade
    ));
  };

  const handleSave = () => {
    // Handle save logic
    console.log('Saving grades:', grades);
  };

  const filteredGrades = grades.filter(g => g.course === selectedCourse && g.type === selectedType);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grades</h1>
        <p className="text-gray-600">Enter and manage student grades</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-university focus:border-transparent"
              >
                <option value="CS101">CS101 - Introduction to Computer Science</option>
                <option value="MATH201">MATH201 - Calculus II</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-university focus:border-transparent"
              >
                <option value="assignment">Assignment</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Grade Input</CardTitle>
            <Button onClick={handleSave}>
              <Save size={18} className="mr-2" />
              Save Grades
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Max Score</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.map((grade) => {
                const percentage = (grade.score / grade.maxScore) * 100;
                const letter = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
                const gradeColor = percentage >= 90 ? 'success' : percentage >= 80 ? 'info' : percentage >= 70 ? 'warning' : 'error';
                
                return (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{grade.studentId}</TableCell>
                    <TableCell>{grade.studentName}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={grade.score}
                        onChange={(e) => handleScoreChange(grade.id, e.target.value)}
                        className="w-20"
                        min={0}
                        max={grade.maxScore}
                      />
                    </TableCell>
                    <TableCell>{grade.maxScore}</TableCell>
                    <TableCell>{percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant={gradeColor as any}>{letter}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}




