/**
 * Game Timer Component - Display elapsed time during gameplay
 */

import { Text } from '@sudobility/components';

interface GameTimerProps {
  /** Formatted time string */
  time: string;
  /** Whether the timer is running */
  isRunning?: boolean;
  /** Optional className */
  className?: string;
}

export default function GameTimer({ time, isRunning = true, className = '' }: GameTimerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        className={`w-4 h-4 ${isRunning ? 'text-[var(--color-primary-500)]' : 'text-[var(--color-text-muted)]'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <Text
        size="sm"
        weight="medium"
        className={`font-mono tabular-nums ${
          isRunning ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
        }`}
      >
        {time}
      </Text>
    </div>
  );
}
