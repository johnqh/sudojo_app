import { useMemo, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heading, Text, Button } from '@sudobility/components';
import { useSudojoRandomBoard, useSudojoLevel } from '@sudobility/sudojo_client';
import { useQueryClient } from '@tanstack/react-query';
import { SudokuGame } from '@/components/sudoku';
import { useSudojoClient } from '@/hooks/useSudojoClient';
import { useProgress } from '@/context/ProgressContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionPaywall } from '@/components/subscription';

// Check if the response indicates auth or subscription is required
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  action?: {
    type: string;
    options?: string[];
  };
}

function isAuthRequiredResponse(response: ApiResponse<unknown> | null | undefined): boolean {
  if (!response) return false;
  return response.success === false && response.action?.type === 'auth_required';
}

function isSubscriptionRequiredResponse(response: ApiResponse<unknown> | null | undefined): boolean {
  if (!response) return false;
  return response.success === false && response.action?.type === 'subscription_required';
}

function isAuthRequiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: string };
  try {
    if (err.message?.includes('Account required')) return true;
  } catch {
    // ignore
  }
  return false;
}

function isSubscriptionRequiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: string };
  try {
    if (err.message?.includes('Daily limit reached') || err.message?.includes('subscription')) return true;
  } catch {
    // ignore
  }
  return false;
}

export default function LevelPlayPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { t } = useTranslation();
  const { networkClient, config, auth } = useSudojoClient();
  const queryClient = useQueryClient();
  const { markCompleted } = useProgress();
  const { settings } = useSettings();
  const { openAuthModal } = useAuth();
  const [completed, setCompleted] = useState(false);

  // Fetch level info for the title
  const { data: levelData } = useSudojoLevel(networkClient, config, auth, levelId ?? '', {
    enabled: !!levelId,
  });

  // Fetch a random board for this level
  const queryParams = useMemo(() => ({ level_uuid: levelId }), [levelId]);
  const { data: boardData, isLoading, error, refetch } = useSudojoRandomBoard(
    networkClient,
    config,
    auth,
    queryParams,
    { enabled: !!levelId }
  );

  const level = levelData?.data;
  const board = boardData?.data;

  // Check if auth is required (either from error or response)
  const authRequired = isAuthRequiredError(error) || isAuthRequiredResponse(boardData);

  // Check if subscription is required
  const subscriptionRequired = isSubscriptionRequiredError(error) || isSubscriptionRequiredResponse(boardData);

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

      {authRequired && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Heading level={2} size="xl" className="mb-4">
              {t('auth.accountRequired')}
            </Heading>
            <Text color="muted" className="mb-6">
              {t('auth.accountRequiredMessage')}
            </Text>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={openAuthModal}>
                {t('auth.login')}
              </Button>
              <Button variant="outline" onClick={openAuthModal}>
                {t('auth.createAccount')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {subscriptionRequired && (
        <div className="py-8">
          <SubscriptionPaywall
            title={t('subscription.limitReached')}
            message={t('subscription.limitReachedMessage')}
            onSuccess={() => refetch()}
          />
        </div>
      )}

      {error && !authRequired && !subscriptionRequired && (
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
