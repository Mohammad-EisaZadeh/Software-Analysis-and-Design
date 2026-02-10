export type UserRole = 'student' | 'professor' | 'admin';

export interface User {
  id: string;
  email: string;
  studentId?: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  professor?: string;
  professorId?: string;
  credits: number;
  semester: string;
  enrolled?: boolean;
  students?: number;
}

export interface Exam {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  date: Date;
  time: string;
  duration: number;
  location?: string;
  type: 'midterm' | 'final' | 'quiz';
}

export interface Grade {
  id: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  type: 'assignment' | 'midterm' | 'final' | 'quiz';
  semester: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: 'food' | 'dormitory' | 'event';
  price?: number;
  image?: string;
  available: boolean;
  date?: Date;
}

export interface CartItem {
  id: string;
  itemId: string;
  title: string;
  category: 'food' | 'dormitory' | 'event';
  price?: number;
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  reservedDate?: Date;
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  type: 'pdf' | 'video' | 'document' | 'link';
  url: string;
  uploadedAt: Date;
  size?: string;
}

export interface ExamQuestion {
  id: string;
  type: 'multiple-choice' | 'descriptive';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
}

export interface ExamTemplate {
  id: string;
  courseId: string;
  title: string;
  duration: number;
  questions: ExamQuestion[];
  createdAt: Date;
}

export interface Objection {
  id: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  gradeId: string;
  message: string;
  status: 'pending' | 'resolved' | 'rejected';
  reply?: string;
  createdAt: Date;
}







