import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Heading, Text, Button } from '@sudobility/components';
import { useDailyGame, useGamePlay } from '@sudobility/sudojo_lib';
import { SudokuGame } from '@/components/sudoku';
import { useApi } from '@/context/apiContextDef';
import { useProgress } from '@/context/ProgressContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuthStatus } from '@sudobility/auth-components';
import { useSubscriptionContext } from '@sudobility/subscription-components';
import { SubscriptionPaywall } from '@/components/subscription';
import { getInfoService } from '@sudobility/di';
import { InfoType } from '@sudobility/types';
import { Section } from '@/components/layout/Section';

export default function DailyPage() {
  const { t } = useTranslation();
  const { networkClient, baseUrl, token } = useApi();
  const { markCompleted, isCompleted } = useProgress();
  const { settings } = useSettings();
  const { openModal: openAuthModal } = useAuthStatus();
  const { currentSubscription } = useSubscriptionContext();

  const { daily, dailyDate, status, refetch } = useDailyGame({
    networkClient,
    baseUrl,
    token: token ?? '',
    subscriptionActive: currentSubscription?.isActive ?? false,
  });

  const alreadyCompleted = dailyDate ? isCompleted('daily', dailyDate) : false;

  // Current game management
  const { currentGame, startGame, updateProgress, clearGame } = useGamePlay();

  // Check if we're resuming the same daily game
  const isResumingGame = useMemo(() => {
    return (
      currentGame?.source === 'daily' &&
      currentGame?.meta.dailyDate === dailyDate &&
      currentGame?.puzzle === daily?.board
    );
  }, [currentGame, dailyDate, daily?.board]);

  // Start/update current game when daily loads
  useEffect(() => {
    if (status === 'success' && daily && dailyDate && !alreadyCompleted) {
      // Only start a new game if not resuming the same one
      if (!isResumingGame) {
        startGame('daily', daily.board, daily.solution, { dailyDate });
      }
    }
  }, [status, daily, dailyDate, alreadyCompleted, isResumingGame, startGame]);

  // Show error via InfoService instead of rendering on page
  useEffect(() => {
    if (status === 'error') {
      getInfoService().show(t('common.error'), t('daily.loadError'), InfoType.ERROR, 5000);
    }
  }, [status, t]);

  const handleComplete = useCallback((timeSeconds: number) => {
    clearGame(); // Clear current game on completion
    if (dailyDate && !alreadyCompleted) {
      markCompleted({ type: 'daily', id: dailyDate, timeSeconds });
    }
  }, [dailyDate, alreadyCompleted, markCompleted, clearGame]);

  return (
    <Section spacing="xl">
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

      {status === 'success' && daily && (
        <SudokuGame
          puzzle={daily.board}
          solution={daily.solution}
          showErrors={settings.showErrors}
          onComplete={handleComplete}
          onProgressUpdate={updateProgress}
          initialInput={isResumingGame ? currentGame?.inputString : undefined}
          initialPencilmarks={isResumingGame ? currentGame?.pencilmarksString : undefined}
          initialElapsedTime={isResumingGame ? currentGame?.elapsedTime : undefined}
        />
      )}
    </Section>
  );
}
