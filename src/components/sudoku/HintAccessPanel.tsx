import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Text, Button } from '@sudobility/components';
import { useAuthStatus } from '@sudobility/auth-components';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import type { HintAccessError } from '@sudobility/sudojo_lib';

interface HintAccessPanelProps {
  accessError: HintAccessError;
  onDismiss: () => void;
}

export default function HintAccessPanel({
  accessError,
  onDismiss,
}: HintAccessPanelProps) {
  const { t } = useTranslation();
  const { openModal: openAuthModal } = useAuthStatus();
  const { navigate } = useLocalizedNavigate();

  const handleAction = useCallback(() => {
    switch (accessError.userState) {
      case 'anonymous':
        // User not logged in - open auth modal
        openAuthModal();
        break;
      case 'no_subscription':
      case 'insufficient_tier':
        // User needs subscription or upgrade - go to subscription page
        navigate('/subscription');
        break;
    }
  }, [accessError.userState, openAuthModal, navigate]);

  // Get title and message based on user state
  const getContent = () => {
    switch (accessError.userState) {
      case 'anonymous':
        return {
          title: t('game.hint.access.loginRequired', 'Login Required'),
          message: t(
            'game.hint.access.loginMessage',
            'Sign in to access hints for this puzzle.'
          ),
          buttonLabel: t('game.hint.access.loginButton', 'Log in to Continue'),
        };
      case 'no_subscription':
        return {
          title: t('game.hint.access.subscriptionRequired', 'Subscription Required'),
          message: t(
            'game.hint.access.subscriptionMessage',
            'This hint requires a subscription. Subscribe to access all hints and features.'
          ),
          buttonLabel: t('game.hint.access.subscribeButton', 'Subscribe'),
        };
      case 'insufficient_tier':
        return {
          title: t('game.hint.access.upgradeRequired', 'Upgrade Required'),
          message: t(
            'game.hint.access.upgradeMessage',
            'This advanced hint requires a higher subscription tier.'
          ),
          buttonLabel: t('game.hint.access.upgradeButton', 'Upgrade Subscription'),
        };
    }
  };

  const content = getContent();

  return (
    <Card className="max-w-[500px] mx-auto border-l-4 border-l-amber-500">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Text weight="semibold" className="text-amber-600 dark:text-amber-400">
              {content.title}
            </Text>
            <Text size="sm" color="muted">
              {content.message}
            </Text>
            <div className="flex gap-2 pt-2">
              <Button variant="default" size="sm" onClick={handleAction}>
                {content.buttonLabel}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label={t('game.hint.dismiss')}
          >
            ✕
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
