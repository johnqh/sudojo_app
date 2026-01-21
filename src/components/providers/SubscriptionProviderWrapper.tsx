import { type ReactNode, useEffect } from 'react';
import {
  SubscriptionProvider,
  useSubscriptionContext,
} from '@sudobility/subscription-components';
import { useAuthStatus } from '@sudobility/auth-components';
import { CONSTANTS } from '../../config/constants';

interface SubscriptionProviderWrapperProps {
  children: ReactNode;
}

/**
 * Inner component that auto-initializes subscription when user is available
 */
function SubscriptionInitializer({ children }: { children: ReactNode }) {
  const { user } = useAuthStatus();
  const { initialize } = useSubscriptionContext();

  useEffect(() => {
    if (user && !user.isAnonymous) {
      initialize(user.uid, user.email || undefined);
    }
  }, [user, initialize]);

  return <>{children}</>;
}

/**
 * Wrapper component that integrates @sudobility/subscription-components
 * with the app's auth system and auto-initializes when user is available
 */
export function SubscriptionProviderWrapper({ children }: SubscriptionProviderWrapperProps) {
  const apiKey = CONSTANTS.DEV_MODE
    ? CONSTANTS.REVENUECAT_API_KEY_SANDBOX
    : CONSTANTS.REVENUECAT_API_KEY;

  return (
    <SubscriptionProvider
      apiKey={apiKey}
      onError={(error) => console.error('[Subscription] Error:', error)}
    >
      <SubscriptionInitializer>{children}</SubscriptionInitializer>
    </SubscriptionProvider>
  );
}
