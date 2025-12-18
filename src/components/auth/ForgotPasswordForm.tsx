import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@sudobility/components';
import { useAuth } from '@/context/AuthContext';

interface ForgotPasswordFormProps {
  onSwitchToSignIn: () => void;
}

export default function ForgotPasswordForm({ onSwitchToSignIn }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const { resetPassword, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch {
      // Error is handled in context
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-green-600 dark:text-green-400">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <Text weight="medium">{t('auth.resetEmailSent')}</Text>
        <Text size="sm" color="muted">
          {t('auth.resetEmailSentDesc', { email })}
        </Text>
        <Button variant="secondary" onClick={onSwitchToSignIn} className="w-full">
          {t('auth.backToSignIn')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Text size="sm" color="muted" className="text-center">
        {t('auth.forgotPasswordDesc')}
      </Text>

      {/* Email field */}
      <div>
        <label
          htmlFor="reset-email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {t('auth.email')}
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            if (error) clearError();
          }}
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('auth.emailPlaceholder')}
        />
      </div>

      {/* Error message */}
      {error && (
        <Text size="sm" className="text-red-600 dark:text-red-400">
          {error}
        </Text>
      )}

      {/* Submit button */}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? t('common.loading') : t('auth.sendResetLink')}
      </Button>

      {/* Back to sign in link */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('auth.backToSignIn')}
        </button>
      </div>
    </form>
  );
}
