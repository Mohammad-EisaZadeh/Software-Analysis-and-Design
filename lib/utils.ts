import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch (error) {
    return 'Invalid Date';
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (error) {
    return 'Invalid Date';
  }
}

export function calculateGPA(grades: { score: number; maxScore: number; credits: number }[]): number {
  if (grades.length === 0) return 0;
  const totalPoints = grades.reduce((sum, grade) => {
    const percentage = (grade.score / grade.maxScore) * 100;
    let points = 0;
    if (percentage >= 90) points = 4.0;
    else if (percentage >= 80) points = 3.0;
    else if (percentage >= 70) points = 2.0;
    else if (percentage >= 60) points = 1.0;
    return sum + points * grade.credits;
  }, 0);
  const totalCredits = grades.reduce((sum, grade) => sum + grade.credits, 0);
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}




