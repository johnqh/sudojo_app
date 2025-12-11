import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Heading, Text } from '@sudobility/components';
import { useSudojoTodayDaily } from 'sudojo_client';
import { SudokuGame } from '@/components/sudoku';
import { useSudojoClient } from '@/hooks/useSudojoClient';
import { useProgress } from '@/context/ProgressContext';
import { useSettings } from '@/context/SettingsContext';

export default function DailyPage() {
  const { t } = useTranslation();
  const { networkClient, config } = useSudojoClient();
  const { markCompleted, isCompleted } = useProgress();
  const { settings } = useSettings();

  const { data, isLoading, error } = useSudojoTodayDaily(networkClient, config);

  const daily = data?.data;
  const dailyDate = daily?.date ? new Date(daily.date).toISOString().split('T')[0] : null;
  const alreadyCompleted = dailyDate ? isCompleted('daily', dailyDate) : false;

  const handleComplete = useCallback(() => {
    if (dailyDate && !alreadyCompleted) {
      markCompleted({ type: 'daily', id: dailyDate });
    }
  }, [dailyDate, alreadyCompleted, markCompleted]);

  return (
    <div className="py-8">
      <header className="mb-8">
        <Heading level={1} size="2xl" className="mb-2">
          {t('daily.title')}
        </Heading>
        <Text color="muted">{t('daily.subtitle')}</Text>
        {daily?.date && (
          <Text size="sm" color="muted" className="mt-1">
            {new Date(daily.date).toLocaleDateString()}
          </Text>
        )}
      </header>

      {isLoading && (
        <div className="text-center py-12">
          <Text color="muted">{t('common.loading')}</Text>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <Text color="muted" className="text-red-500">
            {t('common.error')}
          </Text>
        </div>
      )}

      {daily && (
        <SudokuGame
          puzzle={daily.board}
          solution={daily.solution}
          showErrors={settings.showErrors}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
