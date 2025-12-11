import { useMemo, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heading, Text, Button } from '@sudobility/components';
import { useSudojoRandomBoard, useSudojoLevel } from 'sudojo_client';
import { useQueryClient } from '@tanstack/react-query';
import { SudokuGame } from '@/components/sudoku';
import { useSudojoClient } from '@/hooks/useSudojoClient';
import { useProgress } from '@/context/ProgressContext';
import { useSettings } from '@/context/SettingsContext';

export default function LevelPlayPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { t } = useTranslation();
  const { networkClient, config } = useSudojoClient();
  const queryClient = useQueryClient();
  const { markCompleted } = useProgress();
  const { settings } = useSettings();
  const [completed, setCompleted] = useState(false);

  // Fetch level info for the title
  const { data: levelData } = useSudojoLevel(networkClient, config, levelId ?? '', {
    enabled: !!levelId,
  });

  // Fetch a random board for this level
  const queryParams = useMemo(() => ({ level_uuid: levelId }), [levelId]);
  const { data: boardData, isLoading, error, refetch } = useSudojoRandomBoard(
    networkClient,
    config,
    queryParams,
    { enabled: !!levelId }
  );

  const level = levelData?.data;
  const board = boardData?.data;

  const handleComplete = useCallback((timeSeconds: number) => {
    setCompleted(true);
    if (levelId) {
      markCompleted({ type: 'level', id: levelId, timeSeconds });
    }
  }, [levelId, markCompleted]);

  const handleNextPuzzle = useCallback(() => {
    setCompleted(false);
    // Invalidate the random board query to fetch a new one
    queryClient.invalidateQueries({ queryKey: ['sudojo', 'boards', 'random'] });
    refetch();
  }, [queryClient, refetch]);

  return (
    <div className="py-8">
      <header className="mb-8">
        <Heading level={1} size="2xl" className="mb-2">
          {level ? level.title : t('levels.level', { number: levelId })}
        </Heading>
        {level?.text && (
          <Text color="muted">{level.text}</Text>
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

      {board && (
        <>
          <SudokuGame
            key={board.uuid}
            puzzle={board.board}
            solution={board.solution}
            showErrors={settings.showErrors}
            onComplete={handleComplete}
          />

          {completed && (
            <div className="mt-6 text-center">
              <Button onClick={handleNextPuzzle}>
                {t('game.nextPuzzle')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
