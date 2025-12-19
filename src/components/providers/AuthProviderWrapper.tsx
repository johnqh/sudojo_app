import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@sudobility/auth-components';
import { auth } from '@/config/firebase';
import { createAuthTexts, createAuthErrorTexts } from '@/config/auth-config';
import { getFirebaseErrorMessage } from '@sudobility/sudojo_lib';

interface AuthProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that integrates @sudobility/auth-components
 * with i18n translations and Firebase config
 */
export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  const { t } = useTranslation();

  // If Firebase is not configured, render children without auth
  if (!auth) {
    return <>{children}</>;
  }

  const texts = createAuthTexts(t);
  const errorTexts = createAuthErrorTexts();

  return (
    <AuthProvider
      firebaseConfig={{ type: 'instance', auth }}
      providerConfig={{
        providers: ['google', 'email'],
        enableAnonymous: true,
      }}
      texts={texts}
      errorTexts={errorTexts}
      resolveErrorMessage={getFirebaseErrorMessage}
    >
      {children}
    </AuthProvider>
  );
}
