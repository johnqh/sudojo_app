import { type ReactNode, useEffect } from 'react';
import {
  SubscriptionProvider,
  useSubscriptionContext,
} from '@sudobility/subscription-components';
import { useAuthStatus } from '@sudobility/auth-components';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';

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
  return (
    <SubscriptionProvider
      apiKey={REVENUECAT_API_KEY}
      onError={(error) => console.error('[Subscription] Error:', error)}
    >
      <SubscriptionInitializer>{children}</SubscriptionInitializer>
    </SubscriptionProvider>
  );
}
