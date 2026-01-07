import { Suspense } from 'react';
import { Outlet, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { isLanguageSupported } from '@/i18n';
import ScreenContainer from './ScreenContainer';

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

// Language redirect component - detects and redirects to appropriate language
function LanguageRedirect() {
  const detectLanguage = (): string => {
    // Check localStorage
    try {
      const stored = localStorage.getItem('language');
      if (stored && isLanguageSupported(stored)) {
        return stored;
      }
    } catch {
      // localStorage not available
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (isLanguageSupported(browserLang)) {
      return browserLang;
    }

    return 'en';
  };

  return <Navigate to={`/${detectLanguage()}`} replace />;
}

// Language validator component - validates URL lang and syncs i18n
export default function LanguageValidator() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    if (lang && isLanguageSupported(lang) && i18nInstance.language !== lang) {
      i18nInstance.changeLanguage(lang);
      // Save to localStorage
      try {
        localStorage.setItem('language', lang);
      } catch {
        // Ignore storage errors
      }
    }
  }, [lang, i18nInstance]);

  if (!lang || !isLanguageSupported(lang)) {
    return <LanguageRedirect />;
  }

  return (
    <ScreenContainer>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </ScreenContainer>
  );
}

export { LanguageRedirect };
