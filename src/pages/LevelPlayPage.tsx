import { useCallback, useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heading, Text, Button } from '@sudobility/components';
import { useLevelGame, useGamePlay } from '@sudobility/sudojo_lib';
import { SudokuGame } from '@/components/sudoku';
import { useApi } from '@/context/apiContextDef';
import { useBreadcrumbTitle } from '@/hooks/useBreadcrumbTitle';
import { useGameDataStore } from '@/stores/gameDataStore';
import { useProgress } from '@/context/ProgressContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuthStatus } from '@sudobility/auth-components';
import { useSubscriptionContext } from '@sudobility/subscription-components';
import { SubscriptionPaywall } from '@/components/subscription';
import { getInfoService } from '@sudobility/di';
import { InfoType } from '@sudobility/types';
import { Section } from '@/components/layout/Section';

export default function LevelPlayPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { t } = useTranslation();
  const { networkClient, baseUrl, token } = useApi();
  const { markCompleted } = useProgress();
  const { settings } = useSettings();
  const { openModal: openAuthModal } = useAuthStatus();
  const { currentSubscription } = useSubscriptionContext();
  const [completed, setCompleted] = useState(false);

  // Get level from store (already fetched on LevelsPage)
  const { getLevelById, fetchLevels } = useGameDataStore();
  const level = levelId ? getLevelById(levelId) : undefined;

  // Ensure levels are fetched if navigating directly to this page
  useEffect(() => {
    fetchLevels(networkClient, baseUrl, token ?? '');
  }, [networkClient, baseUrl, token, fetchLevels]);

  // Set breadcrumb title to level name
  useBreadcrumbTitle(level?.title);

  // Fetch a random board for this level with auth/subscription handling
  const { board, status, refetch, nextPuzzle } = useLevelGame({
    networkClient,
    baseUrl,
    token: token ?? '',
    levelId: levelId ?? '',
    subscriptionActive: currentSubscription?.isActive ?? false,
    enabled: !!levelId,
  });

  // Current game management
  const { currentGame, startGame, updateProgress, clearGame } = useGamePlay();

  // Check if we're resuming the same level game
  const isResumingGame = useMemo(() => {
    return (
      currentGame?.source === 'level' &&
      currentGame?.meta.levelId === levelId &&
      currentGame?.puzzle === board?.board
    );
  }, [currentGame, levelId, board?.board]);

  // Start/update current game when level board loads
  useEffect(() => {
    if (status === 'success' && board && levelId) {
      // Only start a new game if not resuming the same one
      if (!isResumingGame) {
        startGame('level', board.board, board.solution, {
          levelId,
          levelTitle: level?.title,
        });
      }
    }
  }, [status, board, levelId, level?.title, isResumingGame, startGame]);

  // Show error via InfoService instead of rendering on page
  useEffect(() => {
    if (status === 'error') {
      getInfoService().show(t('common.error'), t('levels.loadError'), InfoType.ERROR, 5000);
    }
  }, [status, t]);

  const handleComplete = useCallback((timeSeconds: number) => {
    setCompleted(true);
    clearGame(); // Clear current game on completion
    if (levelId) {
      markCompleted({ type: 'level', id: levelId, timeSeconds });
    }
  }, [levelId, markCompleted, clearGame]);

  const handleNextPuzzle = useCallback(() => {
    setCompleted(false);
    clearGame(); // Clear current game when getting next puzzle
    nextPuzzle();
  }, [nextPuzzle, clearGame]);

  return (
    <Section spacing="xl">
      <header className="mb-8">
        <Heading level={1} size="2xl" className="mb-2">
          {level ? level.title : t('levels.level', { number: levelId })}
        </Heading>
        {level?.text && (
          <Text color="muted">{level.text}</Text>
        )}
      </header>

      {status === 'loading' && (
        <div className="text-center py-12">
          <Text color="muted">{t('common.loading')}</Text>
        </div>
      )}

      {status === 'auth_required' && (
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

      {status === 'subscription_required' && (
        <div className="py-8">
          <SubscriptionPaywall
            title={t('subscription.limitReached')}
            message={t('subscription.limitReachedMessage')}
            onSuccess={() => refetch()}
          />
        </div>
      )}

      {status === 'success' && board && (
        <>
          <SudokuGame
            key={board.uuid}
            puzzle={board.board}
            solution={board.solution}
            showErrors={settings.showErrors}
            onComplete={handleComplete}
            onProgressUpdate={updateProgress}
            initialInput={isResumingGame ? currentGame?.inputString : undefined}
            initialPencilmarks={isResumingGame ? currentGame?.pencilmarksString : undefined}
            initialElapsedTime={isResumingGame ? currentGame?.elapsedTime : undefined}
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
    </Section>
  );
}
