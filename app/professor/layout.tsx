import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="professor">{children}</DashboardLayout>;
}







