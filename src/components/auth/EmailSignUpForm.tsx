import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@sudobility/components';
import { useAuth } from '@/context/AuthContext';

interface EmailSignUpFormProps {
  onSwitchToSignIn: () => void;
}

export default function EmailSignUpForm({ onSwitchToSignIn }: EmailSignUpFormProps) {
  const { t } = useTranslation();
  const { signUpWithEmail, loading, error, clearError } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setLocalError(t('auth.passwordMismatch'));
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setLocalError(t('auth.passwordTooShort'));
      return;
    }

    await signUpWithEmail(email, password, displayName || undefined);
  };

  const clearErrors = () => {
    setLocalError(null);
    if (error) clearError();
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display name field */}
      <div>
        <label
          htmlFor="signup-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {t('auth.displayName')}
        </label>
        <input
          id="signup-name"
          type="text"
          value={displayName}
          onChange={e => {
            setDisplayName(e.target.value);
            clearErrors();
          }}
          autoComplete="name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('auth.displayNamePlaceholder')}
        />
      </div>

      {/* Email field */}
      <div>
        <label
          htmlFor="signup-email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {t('auth.email')}
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            clearErrors();
          }}
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('auth.emailPlaceholder')}
        />
      </div>

      {/* Password field */}
      <div>
        <label
          htmlFor="signup-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {t('auth.password')}
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            clearErrors();
          }}
          required
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('auth.passwordPlaceholder')}
        />
      </div>

      {/* Confirm password field */}
      <div>
        <label
          htmlFor="signup-confirm-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {t('auth.confirmPassword')}
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={e => {
            setConfirmPassword(e.target.value);
            clearErrors();
          }}
          required
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('auth.confirmPasswordPlaceholder')}
        />
      </div>

      {/* Error message */}
      {displayError && (
        <Text size="sm" className="text-red-600 dark:text-red-400">
          {displayError}
        </Text>
      )}

      {/* Submit button */}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? t('common.loading') : t('auth.createAccount')}
      </Button>

      {/* Link to sign in */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
        {t('auth.haveAccount')}{' '}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {t('auth.signIn')}
        </button>
      </div>
    </form>
  );
}
