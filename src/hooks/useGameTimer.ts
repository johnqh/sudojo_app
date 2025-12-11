/**
 * Game Timer Hook - Track elapsed time during gameplay
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseGameTimerResult {
  /** Elapsed time in seconds */
  elapsedSeconds: number;
  /** Formatted time string (MM:SS or HH:MM:SS) */
  formattedTime: string;
  /** Whether the timer is running */
  isRunning: boolean;
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Resume the timer */
  resume: () => void;
  /** Reset the timer */
  reset: () => void;
  /** Stop the timer (pause and return final time) */
  stop: () => number;
}

/**
 * Format seconds into MM:SS or HH:MM:SS string
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

interface UseGameTimerOptions {
  /** Auto-start timer on mount */
  autoStart?: boolean;
  /** Initial time in seconds */
  initialTime?: number;
}

/**
 * Hook for game timer functionality
 *
 * @example
 * ```tsx
 * const { elapsedSeconds, formattedTime, isRunning, start, pause, stop } = useGameTimer({ autoStart: true });
 *
 * // Display: <span>{formattedTime}</span>
 * // On completion: const finalTime = stop();
 * ```
 */
export function useGameTimer(options: UseGameTimerOptions = {}): UseGameTimerResult {
  const { autoStart = false, initialTime = 0 } = options;

  const [elapsedSeconds, setElapsedSeconds] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const start = useCallback(() => {
    setElapsedSeconds(0);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    return elapsedSeconds;
  }, [elapsedSeconds]);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    isRunning,
    start,
    pause,
    resume,
    reset,
    stop,
  };
}
