import { Text } from '@sudobility/components';
import { useTranslation } from 'react-i18next';

interface ProgressPieProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Size of the pie chart in pixels */
  size?: number;
}

/**
 * A small pie chart showing progress percentage
 */
export default function ProgressPie({ progress, size = 24 }: ProgressPieProps) {
  const { t } = useTranslation();

  // SVG circle properties
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <Text size="sm" color="muted">
        {t('game.progress', { percent: progress })}
      </Text>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-[var(--color-primary-500)] transition-all duration-300"
        />
      </svg>
    </div>
  );
}
