import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n, { isLanguageSupported } from './i18n';
import ThemeProvider from './context/ThemeContext';
import { AuthProviderWrapper } from './components/providers/AuthProviderWrapper';
import { SettingsProvider } from './context/SettingsContext';
import { ProgressProvider } from './context/ProgressContext';
import { SubscriptionProviderWrapper } from './components/providers/SubscriptionProviderWrapper';

// Pages (lazy loaded)
import { lazy, Suspense, useEffect } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const DailyPage = lazy(() => import('./pages/DailyPage'));
const EnterPage = lazy(() => import('./pages/EnterPage'));
const LevelsPage = lazy(() => import('./pages/LevelsPage'));
const LevelPlayPage = lazy(() => import('./pages/LevelPlayPage'));
const TechniquesPage = lazy(() => import('./pages/TechniquesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Layout
import ScreenContainer from './components/layout/ScreenContainer';

// PWA
import { InstallPrompt } from './components/pwa';

// Info Banner for displaying notifications/errors
import { InfoBanner } from '@sudobility/di_web';

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
    },
  },
});

// Language redirect component
function LanguageRedirect() {
  const detectLanguage = (): string => {
    // Check localStorage
    const stored = localStorage.getItem('language');
    if (stored && isLanguageSupported(stored)) {
      return stored;
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

// Language validator component
function LanguageValidator() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    if (lang && isLanguageSupported(lang) && i18nInstance.language !== lang) {
      i18nInstance.changeLanguage(lang);
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

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

// Home redirect for language root
function LanguageHomeRedirect() {
  const { lang } = useParams<{ lang: string }>();
  return <Navigate to={`/${lang || 'en'}`} replace />;
}

function App() {
  return (
    <>
      <InfoBanner />
      <HelmetProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <SettingsProvider>
              <ProgressProvider>
                <QueryClientProvider client={queryClient}>
                  <AuthProviderWrapper>
                    <SubscriptionProviderWrapper>
                      <BrowserRouter>
                        <InstallPrompt />
                        <Routes>
                          {/* Root redirect */}
                          <Route path="/" element={<LanguageRedirect />} />

                          {/* Language-prefixed routes */}
                          <Route path="/:lang" element={<LanguageValidator />}>
                            <Route index element={<HomePage />} />
                            <Route path="daily" element={<DailyPage />} />
                            <Route path="enter" element={<EnterPage />} />
                            <Route path="play" element={<LevelsPage />} />
                            <Route path="play/:levelId" element={<LevelPlayPage />} />
                            <Route path="techniques" element={<TechniquesPage />} />
                            <Route path="techniques/:techniqueId" element={<TechniquesPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="*" element={<LanguageHomeRedirect />} />
                          </Route>

                          {/* Catch-all */}
                          <Route path="*" element={<LanguageRedirect />} />
                        </Routes>
                      </BrowserRouter>
                    </SubscriptionProviderWrapper>
                  </AuthProviderWrapper>
                </QueryClientProvider>
              </ProgressProvider>
            </SettingsProvider>
          </ThemeProvider>
        </I18nextProvider>
      </HelmetProvider>
    </>
  );
}

export default App;
