import { useCallback, useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heading, Text, Button } from '@sudobility/components';
import { SudokuGame } from '@/components/sudoku';
import { useApi } from '@/context/apiContextDef';
import { useBreadcrumbTitle } from '@/hooks/useBreadcrumbTitle';
import { useGameDataStore } from '@/stores/gameDataStore';
import { useSettings } from '@/context/SettingsContext';
import { useAuthStatus } from '@sudobility/auth-components';
import { useSubscriptionContext } from '@sudobility/subscription-components';
import { SubscriptionPaywall } from '@/components/subscription';
import { getInfoService } from '@sudobility/di';
import { InfoType } from '@sudobility/types';
import { Section } from '@/components/layout/Section';
import type { TechniquePractice } from '@sudobility/sudojo_types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type PracticeFetchStatus =
  | 'loading'
  | 'success'
  | 'auth_required'
  | 'subscription_required'
  | 'no_practices'
  | 'error';

export default function PracticePage() {
  const { techniqueId } = useParams<{ techniqueId: string }>();
  const { t } = useTranslation();
  const { networkClient, baseUrl, token } = useApi();
  const { settings } = useSettings();
  const { openModal: openAuthModal } = useAuthStatus();
  useSubscriptionContext(); // Initialize subscription context
  const queryClient = useQueryClient();
  const [completed, setCompleted] = useState(false);

  // Get technique from store
  const { getTechniqueById, fetchTechniques } = useGameDataStore();
  const technique = techniqueId ? getTechniqueById(techniqueId) : undefined;

  // Ensure techniques are fetched if navigating directly to this page
  useEffect(() => {
    fetchTechniques(networkClient, baseUrl, token ?? '');
  }, [networkClient, baseUrl, token, fetchTechniques]);

  // Set breadcrumb title
  useBreadcrumbTitle(technique?.title ? `${t('practice.title', 'Practice')}: ${technique.title}` : undefined);

  // Fetch a random practice for this technique
  const {
    data: practiceResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sudojo', 'practices', 'random', techniqueId],
    queryFn: async (): Promise<{ success: boolean; data?: TechniquePractice; error?: string }> => {
      const response = await networkClient.request<{ success: boolean; data?: TechniquePractice; error?: string }>(
        `${baseUrl}/api/v1/practices/technique/${techniqueId}/random`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      return response.data!;
    },
    enabled: !!techniqueId,
    staleTime: 0, // Always fetch fresh for random
    retry: false,
  });

  const practice = practiceResponse?.data;

  // Determine status
  const status: PracticeFetchStatus = useMemo(() => {
    if (isLoading) return 'loading';
    if (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401') || errorMessage.includes('auth')) {
        return 'auth_required';
      }
      if (errorMessage.includes('402') || errorMessage.includes('subscription')) {
        return 'subscription_required';
      }
      return 'error';
    }
    if (practiceResponse?.success === false) {
      if (practiceResponse.error?.includes('No practices found')) {
        return 'no_practices';
      }
      return 'error';
    }
    if (practice) return 'success';
    return 'loading';
  }, [isLoading, error, practiceResponse, practice]);

  // Show error via InfoService
  useEffect(() => {
    if (status === 'error') {
      getInfoService().show(t('common.error'), t('practice.loadError', 'Failed to load practice'), InfoType.ERROR, 5000);
    }
  }, [status, t]);

  const handleComplete = useCallback(() => {
    setCompleted(true);
    // NOTE: Practice games are NOT persisted to currentGame
    // No markCompleted or clearGame calls here
  }, []);

  const handleNextPractice = useCallback(() => {
    setCompleted(false);
    // Invalidate and refetch to get a new random practice
    queryClient.invalidateQueries({ queryKey: ['sudojo', 'practices', 'random', techniqueId] });
    refetch();
  }, [queryClient, techniqueId, refetch]);

  return (
    <Section spacing="xl">
      <header className="mb-8">
        <Heading level={1} size="2xl" className="mb-2">
          {technique
            ? t('practice.titleWithTechnique', { technique: technique.title, defaultValue: `Practice: ${technique.title}` })
            : t('practice.title', 'Practice')}
        </Heading>
        <Text color="muted">
          {t('practice.description', 'Apply the technique you learned to solve this puzzle.')}
        </Text>
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

      {status === 'no_practices' && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Heading level={2} size="xl" className="mb-4">
              {t('practice.noPractices', 'No Practices Available')}
            </Heading>
            <Text color="muted">
              {t('practice.noPracticesMessage', 'There are no practice puzzles available for this technique yet. Please check back later.')}
            </Text>
          </div>
        </div>
      )}

      {status === 'success' && practice && (
        <>
          <SudokuGame
            key={practice.uuid}
            puzzle={practice.board}
            solution={practice.solution}
            showErrors={settings.showErrors}
            onComplete={handleComplete}
            // NOTE: No onProgressUpdate - practice is NOT persisted
            initialPencilmarks={practice.pencilmarks ?? undefined}
          />

          {completed && (
            <div className="mt-6 text-center">
              <Button onClick={handleNextPractice}>
                {t('practice.nextPractice', 'Next Practice')}
              </Button>
            </div>
          )}
        </>
      )}

      {status === 'error' && (
        <div className="text-center py-12">
          <Text color="muted">{t('practice.loadError', 'Failed to load practice. Please try again.')}</Text>
          <Button onClick={() => refetch()} className="mt-4">
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      )}
    </Section>
  );
}
