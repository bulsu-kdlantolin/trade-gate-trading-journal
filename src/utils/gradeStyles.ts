import { TradeGrade } from '../types/trade';

export interface GradeStyleConfig {
  text: string;
  badge: string;
  progress: string;
}

/**
 * Returns consistent styling for setup grades across the application:
 * - A+: Super green
 * - A:  Light green
 * - B:  Light red
 * - B+: Super red
 * - C:  Super red
 */
export function getGradeStyle(grade: TradeGrade | string): GradeStyleConfig {
  switch (grade) {
    case 'A+':
      // Super green
      return {
        text: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        progress: 'bg-emerald-500',
      };
    case 'A':
      // Light green
      return {
        text: 'text-emerald-500 dark:text-emerald-300',
        badge: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-300',
        progress: 'bg-emerald-400/80',
      };
    case 'B':
      // Light red
      return {
        text: 'text-rose-400 dark:text-rose-300',
        badge: 'bg-rose-500/10 text-rose-500 dark:text-rose-300',
        progress: 'bg-rose-400/80',
      };
    case 'B+':
    case 'C':
    default:
      // Super red
      return {
        text: 'text-rose-600 dark:text-rose-500',
        badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-500',
        progress: 'bg-rose-500',
      };
  }
}

