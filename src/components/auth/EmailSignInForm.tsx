import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@sudobility/components';
import { useAuth } from '@/context/AuthContext';

interface EmailSignInFormProps {
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function EmailSignInForm({
  onSwitchToSignUp,
  onSwitchToForgotPassword,
}: EmailSignInFormProps) {
  const { t } = useTranslation();
  const { signInWithEmail, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithEmail(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email field */}
      <div>
        <label
          htmlFor="signin-email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {t('auth.email')}
        </label>
        <input
          id="signin-email"
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

      {/* Password field */}
      <div>
        <label
          htmlFor="signin-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {t('auth.password')}
        </label>
        <input
          id="signin-password"
          type="password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            if (error) clearError();
          }}
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('auth.passwordPlaceholder')}
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
        {loading ? t('common.loading') : t('auth.signIn')}
      </Button>

      {/* Links */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onSwitchToForgotPassword}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('auth.forgotPassword')}
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('auth.noAccount')}{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {t('auth.signUp')}
          </button>
        </div>
      </div>
    </form>
  );
}
