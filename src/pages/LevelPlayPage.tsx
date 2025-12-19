import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heading, Text, Button } from '@sudobility/components';
import { useSudojoLevel } from '@sudobility/sudojo_client';
import { useLevelGame } from '@sudobility/sudojo_lib';
import { SudokuGame } from '@/components/sudoku';
import { useSudojoClient } from '@/hooks/useSudojoClient';
import { useProgress } from '@/context/ProgressContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuthStatus } from '@sudobility/auth-components';
import { useSubscriptionContext } from '@sudobility/subscription-components';
import { SubscriptionPaywall } from '@/components/subscription';

export default function LevelPlayPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { t } = useTranslation();
  const { networkClient, config, auth } = useSudojoClient();
  const { markCompleted } = useProgress();
  const { settings } = useSettings();
  const { openModal: openAuthModal } = useAuthStatus();
  const { currentSubscription } = useSubscriptionContext();
  const [completed, setCompleted] = useState(false);

  // Fetch level info for the title
  const { data: levelData } = useSudojoLevel(networkClient, config, auth, levelId ?? '', {
    enabled: !!levelId,
  });

  // Fetch a random board for this level with auth/subscription handling
  const { board, status, refetch, nextPuzzle } = useLevelGame({
    networkClient,
    config,
    auth,
    levelId: levelId ?? '',
    subscriptionActive: currentSubscription?.isActive ?? false,
    enabled: !!levelId,
  });

  const level = levelData?.data;

  const handleComplete = useCallback((timeSeconds: number) => {
    setCompleted(true);
    if (levelId) {
      markCompleted({ type: 'level', id: levelId, timeSeconds });
    }
  }, [levelId, markCompleted]);

  const handleNextPuzzle = useCallback(() => {
    setCompleted(false);
    nextPuzzle();
  }, [nextPuzzle]);

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

      {status === 'error' && (
        <div className="text-center py-12">
          <Text color="muted" className="text-red-500">
            {t('common.error')}
          </Text>
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
