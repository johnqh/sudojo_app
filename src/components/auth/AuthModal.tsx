import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@sudobility/components';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import EmailSignInForm from './EmailSignInForm';
import EmailSignUpForm from './EmailSignUpForm';
import ForgotPasswordForm from './ForgotPasswordForm';

type AuthMode = 'select' | 'email-signin' | 'email-signup' | 'forgot-password';

export default function AuthModal() {
  const { t } = useTranslation();
  const { isAuthModalOpen, closeAuthModal, signInWithGoogle, loading, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('select');

  // Reset to select mode when modal is opened
  useEffect(() => {
    if (isAuthModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('select');
      clearError();
    }
  }, [isAuthModalOpen, clearError]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  const handleSwitchMode = useCallback(
    (newMode: AuthMode) => {
      clearError();
      setMode(newMode);
    },
    [clearError]
  );

  if (!isAuthModalOpen) {
    return null;
  }

  const renderContent = () => {
    switch (mode) {
      case 'email-signin':
        return (
          <EmailSignInForm
            onSwitchToSignUp={() => handleSwitchMode('email-signup')}
            onSwitchToForgotPassword={() => handleSwitchMode('forgot-password')}
          />
        );
      case 'email-signup':
        return <EmailSignUpForm onSwitchToSignIn={() => handleSwitchMode('email-signin')} />;
      case 'forgot-password':
        return <ForgotPasswordForm onSwitchToSignIn={() => handleSwitchMode('email-signin')} />;
      default:
        return (
          <div className="space-y-4">
            {/* Google Sign In */}
            <Button
              variant="secondary"
              size="lg"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('auth.continueWithGoogle')}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {t('auth.or')}
                </span>
              </div>
            </div>

            {/* Email Sign In */}
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleSwitchMode('email-signin')}
              className="w-full"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {t('auth.continueWithEmail')}
            </Button>

            {/* Sign up link */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('email-signup')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {t('auth.signUp')}
              </button>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'email-signin':
        return t('auth.signInWithEmail');
      case 'email-signup':
        return t('auth.createAccount');
      case 'forgot-password':
        return t('auth.resetPassword');
      default:
        return t('auth.signInTitle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Text size="lg" weight="semibold">
            {getTitle()}
          </Text>
          <button
            onClick={closeAuthModal}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.close')}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
