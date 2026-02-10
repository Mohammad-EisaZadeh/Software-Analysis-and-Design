'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Bell,
  FileText,
  ShoppingCart,
  ShoppingBag,
  FolderOpen,
  Users,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  Settings,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
}

const studentItems = [
  { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { label: 'My Courses', href: '/student/courses', icon: BookOpen },
  { label: 'Exams Schedule', href: '/student/exams', icon: Calendar },
  { label: 'Notifications', href: '/student/notifications', icon: Bell },
  { label: 'Transcript', href: '/student/transcript', icon: FileText },
  { label: 'Marketplace', href: '/student/marketplace', icon: ShoppingBag },
  { label: 'Cart', href: '/student/cart', icon: ShoppingCart },
  { label: 'Course Materials', href: '/student/materials', icon: FolderOpen },
  { label: 'Profile', href: '/student/profile', icon: Settings },
];

const professorItems = [
  { label: 'Dashboard', href: '/professor', icon: LayoutDashboard },
  { label: 'My Courses', href: '/professor/courses', icon: BookOpen },
  { label: 'Students', href: '/professor/students', icon: Users },
  { label: 'Grades', href: '/professor/grades', icon: GraduationCap },
  { label: 'Exam Management', href: '/professor/exams', icon: ClipboardList },
  { label: 'Objections', href: '/professor/objections', icon: MessageSquare },
  { label: 'Course Materials', href: '/professor/materials', icon: FolderOpen },
  { label: 'Profile', href: '/professor/profile', icon: Settings },
];

const adminItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Students Management', href: '/admin/students', icon: Users },
  { label: 'Professors Management', href: '/admin/professors', icon: GraduationCap },
  { label: 'Courses Management', href: '/admin/courses', icon: BookOpen },
  { label: 'Profile', href: '/admin/profile', icon: Settings },
];

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const items =
    role === 'student'
      ? studentItems
      : role === 'professor'
      ? professorItems
      : adminItems;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={items} role={role} />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}







