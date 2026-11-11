import { TradeGrade } from '../types/trade';

export interface GradeStyleConfig {
  text: string;
  badge: string;
  progress: string;
}

/**
 * Returns consistent styling for setup grades across the application:
 * - A+: Super Green (Pristine High-Conviction / Gate Unlocked Peak Confluence)
 * - A:  Light Green (High Confluence)
 * - B+: Amber / Neutral (Moderate-High Confluence)
 * - B:  Light Red (Moderate / Lower Confluence)
 * - C:  Super Red (Gate Violation / Unverified / Marginal)
 */
export function getGradeStyle(grade: TradeGrade | string): GradeStyleConfig {
  switch (grade) {
    case 'A+':
      return {
        text: 'text-emerald-500 dark:text-emerald-400 font-black',
        badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold',
        progress: 'bg-emerald-500',
      };
    case 'A':
      return {
        text: 'text-emerald-600 dark:text-emerald-400 font-bold',
        badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-semibold',
        progress: 'bg-emerald-400',
      };
    case 'B+':
      return {
        text: 'text-amber-500 dark:text-amber-400 font-bold',
        badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold',
        progress: 'bg-amber-400',
      };
    case 'B':
      return {
        text: 'text-sky-500 dark:text-sky-400 font-bold',
        badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold',
        progress: 'bg-sky-400',
      };
    case 'C':
    default:
      return {
        text: 'text-rose-500 dark:text-rose-400 font-black',
        badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold',
        progress: 'bg-rose-500',
      };
  }
}

