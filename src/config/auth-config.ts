import type { AuthTexts, AuthErrorTexts } from '@sudobility/auth-components';
import type { TFunction } from 'i18next';
import { getFirebaseErrorMessage } from '@sudobility/auth_lib';

/**
 * Create auth texts from i18next translations
 */
export function createAuthTexts(t: TFunction): AuthTexts {
  return {
    // Titles
    signInTitle: t('auth.signInTitle'),
    signInWithEmail: t('auth.signInWithEmail'),
    createAccount: t('auth.createAccount'),
    resetPassword: t('auth.resetPassword'),

    // Buttons
    signIn: t('auth.signIn'),
    signUp: t('auth.signUp'),
    logout: t('auth.logout'),
    login: t('auth.login'),
    continueWithGoogle: t('auth.continueWithGoogle'),
    continueWithApple: 'Continue with Apple', // Not currently used
    continueWithEmail: t('auth.continueWithEmail'),
    sendResetLink: t('auth.sendResetLink'),
    backToSignIn: t('auth.backToSignIn'),
    close: t('common.close'),

    // Labels
    email: t('auth.email'),
    password: t('auth.password'),
    confirmPassword: t('auth.confirmPassword'),
    displayName: t('auth.displayName'),

    // Placeholders
    emailPlaceholder: t('auth.emailPlaceholder'),
    passwordPlaceholder: t('auth.passwordPlaceholder'),
    confirmPasswordPlaceholder: t('auth.confirmPasswordPlaceholder'),
    displayNamePlaceholder: t('auth.displayNamePlaceholder'),

    // Links
    forgotPassword: t('auth.forgotPassword'),
    noAccount: t('auth.noAccount'),
    haveAccount: t('auth.haveAccount'),
    or: t('auth.or'),

    // Messages
    resetEmailSent: t('auth.resetEmailSent'),
    resetEmailSentDesc: t('auth.resetEmailSentDesc'),
    passwordMismatch: t('auth.passwordMismatch'),
    passwordTooShort: t('auth.passwordTooShort'),
    loading: t('common.loading'),
  };
}

/**
 * Create auth error texts - uses auth_lib's getFirebaseErrorMessage
 * for consistent error message handling
 */
export function createAuthErrorTexts(): AuthErrorTexts {
  return {
    'auth/user-not-found': getFirebaseErrorMessage('auth/user-not-found'),
    'auth/wrong-password': getFirebaseErrorMessage('auth/wrong-password'),
    'auth/invalid-email': getFirebaseErrorMessage('auth/invalid-email'),
    'auth/invalid-credential': getFirebaseErrorMessage('auth/invalid-credential'),
    'auth/email-already-in-use': getFirebaseErrorMessage('auth/email-already-in-use'),
    'auth/weak-password': getFirebaseErrorMessage('auth/weak-password'),
    'auth/too-many-requests': getFirebaseErrorMessage('auth/too-many-requests'),
    'auth/network-request-failed': getFirebaseErrorMessage('auth/network-request-failed'),
    'auth/popup-closed-by-user': getFirebaseErrorMessage('auth/popup-closed-by-user'),
    'auth/popup-blocked': getFirebaseErrorMessage('auth/popup-blocked'),
    'auth/account-exists-with-different-credential': getFirebaseErrorMessage('auth/account-exists-with-different-credential'),
    'auth/operation-not-allowed': getFirebaseErrorMessage('auth/operation-not-allowed'),
    default: getFirebaseErrorMessage(''),
  };
}
