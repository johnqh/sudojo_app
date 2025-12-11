/**
 * Progress Context - Track completed puzzles and user statistics
 */

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface CompletedPuzzle {
  /** Puzzle identifier */
  id: string;
  /** Type of puzzle */
  type: 'daily' | 'level';
  /** Completion timestamp */
  completedAt: string;
  /** Time to complete in seconds (optional) */
  timeSeconds?: number;
}

export interface GameStats {
  /** Best time in seconds for daily puzzles */
  bestDailyTime: number | null;
  /** Best time in seconds for level puzzles */
  bestLevelTime: number | null;
  /** Average time in seconds */
  averageTime: number | null;
  /** Total time played in seconds */
  totalTimePlayed: number;
}

export interface UserProgress {
  /** List of completed puzzles */
  completedPuzzles: CompletedPuzzle[];
  /** Current daily streak */
  dailyStreak: number;
  /** Last daily completion date (YYYY-MM-DD) */
  lastDailyDate: string | null;
  /** Total puzzles completed */
  totalCompleted: number;
  /** Game statistics */
  stats: GameStats;
}

const DEFAULT_PROGRESS: UserProgress = {
  completedPuzzles: [],
  dailyStreak: 0,
  lastDailyDate: null,
  totalCompleted: 0,
  stats: {
    bestDailyTime: null,
    bestLevelTime: null,
    averageTime: null,
    totalTimePlayed: 0,
  },
};

const PROGRESS_KEY = 'sudojo-progress';

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

/**
 * Calculate game statistics from completed puzzles
 */
function calculateStats(completedPuzzles: CompletedPuzzle[], newTime?: number): GameStats {
  const puzzlesWithTime = completedPuzzles.filter(p => p.timeSeconds !== undefined);

  // Calculate total time
  const totalTimePlayed = puzzlesWithTime.reduce((sum, p) => sum + (p.timeSeconds ?? 0), 0) + (newTime ?? 0);

  // Calculate average time
  const count = puzzlesWithTime.length + (newTime !== undefined ? 1 : 0);
  const averageTime = count > 0 ? Math.round(totalTimePlayed / count) : null;

  // Calculate best times by type
  const dailyTimes = completedPuzzles
    .filter(p => p.type === 'daily' && p.timeSeconds !== undefined)
    .map(p => p.timeSeconds!);
  const levelTimes = completedPuzzles
    .filter(p => p.type === 'level' && p.timeSeconds !== undefined)
    .map(p => p.timeSeconds!);

  const bestDailyTime = dailyTimes.length > 0 ? Math.min(...dailyTimes) : null;
  const bestLevelTime = levelTimes.length > 0 ? Math.min(...levelTimes) : null;

  return {
    bestDailyTime,
    bestLevelTime,
    averageTime,
    totalTimePlayed,
  };
}

/**
 * Calculate streak based on daily completions
 */
function calculateStreak(completedPuzzles: CompletedPuzzle[], lastDailyDate: string | null): number {
  if (!lastDailyDate) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // If last daily wasn't today or yesterday, streak is broken
  if (lastDailyDate !== today && lastDailyDate !== yesterday) {
    return 0;
  }

  // Count consecutive days
  const dailyDates = completedPuzzles
    .filter(p => p.type === 'daily')
    .map(p => p.id)
    .sort()
    .reverse();

  let streak = 0;
  let currentDate = lastDailyDate === today ? today : yesterday;

  for (const date of dailyDates) {
    if (date === currentDate) {
      streak++;
      // Go back one day
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      currentDate = d.toISOString().split('T')[0];
    } else if (date < currentDate) {
      break;
    }
  }

  return streak;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [progress, setProgress] = useLocalStorage<UserProgress>(PROGRESS_KEY, DEFAULT_PROGRESS);

  const markCompleted = useCallback(
    (puzzle: Omit<CompletedPuzzle, 'completedAt'>) => {
      setProgress(prev => {
        // Check if already completed
        const alreadyCompleted = prev.completedPuzzles.some(
          p => p.type === puzzle.type && p.id === puzzle.id
        );

        if (alreadyCompleted) {
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
      return progress.completedPuzzles.some(p => p.type === type && p.id === id);
    },
    [progress.completedPuzzles]
  );

  const getCompletedLevelIds = useCallback((): string[] => {
    return progress.completedPuzzles
      .filter(p => p.type === 'level')
      .map(p => p.id);
  }, [progress.completedPuzzles]);

  const getCompletedDailyDates = useCallback((): string[] => {
    return progress.completedPuzzles
      .filter(p => p.type === 'daily')
      .map(p => p.id);
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
