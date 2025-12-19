/**
 * Progress Context - Track completed puzzles and user statistics
 */

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  // Types
  type CompletedPuzzle,
  type GameStats,
  type UserProgress,
  DEFAULT_PROGRESS,
  PROGRESS_STORAGE_KEY,
  // Utility functions
  calculateStats,
  calculateStreak,
  isPuzzleCompleted,
  getCompletedLevelIds as getCompletedLevelIdsUtil,
  getCompletedDailyDates as getCompletedDailyDatesUtil,
} from '@sudobility/sudojo_lib';

// Re-export types for external use
export type { CompletedPuzzle, GameStats, UserProgress };

interface ProgressContextType {
  progress: UserProgress;
  /** Mark a puzzle as completed */
  markCompleted: (puzzle: Omit<CompletedPuzzle, 'completedAt'>) => void;
  /** Check if a puzzle is completed */
  isCompleted: (type: 'daily' | 'level', id: string) => boolean;
  /** Get completed level IDs */
  getCompletedLevelIds: () => string[];
  /** Get completed daily dates */
  getCompletedDailyDates: () => string[];
  /** Reset all progress */
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [progress, setProgress] = useLocalStorage<UserProgress>(PROGRESS_STORAGE_KEY, DEFAULT_PROGRESS);

  const markCompleted = useCallback(
    (puzzle: Omit<CompletedPuzzle, 'completedAt'>) => {
      setProgress(prev => {
        // Check if already completed
        if (isPuzzleCompleted(prev.completedPuzzles, puzzle.type, puzzle.id)) {
          return prev;
        }

        const completedPuzzle: CompletedPuzzle = {
          ...puzzle,
          completedAt: new Date().toISOString(),
        };

        const newCompletedPuzzles = [...prev.completedPuzzles, completedPuzzle];

        // Update daily tracking
        let newLastDailyDate = prev.lastDailyDate;
        if (puzzle.type === 'daily') {
          newLastDailyDate = puzzle.id; // Daily id is the date
        }

        const newStreak = calculateStreak(newCompletedPuzzles, newLastDailyDate);
        const newStats = calculateStats(newCompletedPuzzles, puzzle.timeSeconds);

        return {
          completedPuzzles: newCompletedPuzzles,
          dailyStreak: newStreak,
          lastDailyDate: newLastDailyDate,
          totalCompleted: prev.totalCompleted + 1,
          stats: newStats,
        };
      });
    },
    [setProgress]
  );

  const isCompleted = useCallback(
    (type: 'daily' | 'level', id: string): boolean => {
      return isPuzzleCompleted(progress.completedPuzzles, type, id);
    },
    [progress.completedPuzzles]
  );

  const getCompletedLevelIds = useCallback((): string[] => {
    return getCompletedLevelIdsUtil(progress.completedPuzzles);
  }, [progress.completedPuzzles]);

  const getCompletedDailyDates = useCallback((): string[] => {
    return getCompletedDailyDatesUtil(progress.completedPuzzles);
  }, [progress.completedPuzzles]);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, [setProgress]);

  const value: ProgressContextType = useMemo(
    () => ({
      progress,
      markCompleted,
      isCompleted,
      getCompletedLevelIds,
      getCompletedDailyDates,
      resetProgress,
    }),
    [progress, markCompleted, isCompleted, getCompletedLevelIds, getCompletedDailyDates, resetProgress]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): ProgressContextType {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
