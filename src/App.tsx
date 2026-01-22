import { type ReactNode, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { SudobilityAppWithFirebaseAuth } from '@sudobility/building_blocks/firebase';
import { useAuthStatus } from '@sudobility/auth-components';
import {
  SubscriptionProvider,
  useSubscriptionContext,
} from '@sudobility/subscription-components';
import { CONSTANTS } from './config/constants';
import { PerformancePanel } from '@sudobility/components';
import { SettingsProvider } from './context/SettingsContext';
import { ProgressProvider } from './context/ProgressContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const DailyPage = lazy(() => import('./pages/DailyPage'));
const EnterPage = lazy(() => import('./pages/EnterPage'));
const LevelsPage = lazy(() => import('./pages/LevelsPage'));
const LevelPlayPage = lazy(() => import('./pages/LevelPlayPage'));
const TechniquesPage = lazy(() => import('./pages/TechniquesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const TechniqueImageGenerator = lazy(() => import('./pages/TechniqueImageGenerator'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CookiesPage = lazy(() => import('./pages/CookiesPage'));
const SitemapPage = lazy(() => import('./pages/SitemapPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Layout components
import LanguageValidator, { LanguageRedirect } from './components/layout/LanguageValidator';
const ProtectedRoute = lazy(() => import('./components/layout/ProtectedRoute'));

// PWA
import { InstallPrompt } from './components/pwa';

// Stable reference for PerformancePanel to prevent infinite re-renders
const PERFORMANCE_API_PATTERNS = ['/api/'];

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

// Auto-initializes subscription when user is authenticated
function SubscriptionInitializer({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuthStatus();
  const { initialize } = useSubscriptionContext();

  useEffect(() => {
    // Only initialize for authenticated (non-anonymous) users
    if (!authLoading && user && !user.isAnonymous) {
      initialize(user.uid, user.email || undefined);
    }
  }, [authLoading, user, initialize]);

  return <>{children}</>;
}

// Combined app-specific providers (ApiProvider is built into SudobilityAppWithFirebaseAuth)
function AppProviders({ children }: { children: ReactNode }) {
  const subscriptionApiKey = CONSTANTS.DEV_MODE
    ? CONSTANTS.REVENUECAT_API_KEY_SANDBOX
    : CONSTANTS.REVENUECAT_API_KEY;

  return (
    <SettingsProvider>
      <ProgressProvider>
        <SubscriptionProvider
          apiKey={subscriptionApiKey}
          onError={(error) => console.error('[Subscription] Error:', error)}
        >
          <SubscriptionInitializer>{children}</SubscriptionInitializer>
        </SubscriptionProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}

// Performance panel component
function PerformancePanelComponent() {
  if (import.meta.env.VITE_SHOW_PERFORMANCE_MONITOR !== 'true') {
    return null;
  }
  return (
    <PerformancePanel
      enabled={true}
      position="bottom-right"
      apiPatterns={PERFORMANCE_API_PATTERNS}
    />
  );
}

function AppRoutes() {
  return (
    <>
      <InstallPrompt />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<LanguageRedirect />} />

          {/* Dev routes (no auth/layout) */}
          <Route
            path="/dev/technique-images"
            element={<TechniqueImageGenerator />}
          />

          {/* Language-prefixed routes */}
          <Route path="/:lang" element={<LanguageValidator />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="daily" element={<DailyPage />} />
            <Route path="enter" element={<EnterPage />} />
            <Route path="play" element={<LevelsPage />} />
            <Route path="play/enter" element={<EnterPage />} />
            <Route path="play/:levelId" element={<LevelPlayPage />} />
            <Route path="techniques" element={<TechniquesPage />} />
            <Route path="techniques/:techniqueId" element={<TechniquesPage />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/:section"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="cookies" element={<CookiesPage />} />
            <Route path="sitemap" element={<SitemapPage />} />
            <Route
              path="subscription"
              element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<LanguageHomeRedirect />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<LanguageRedirect />} />
        </Routes>
      </Suspense>
      <PerformancePanelComponent />
    </>
  );
}

function App() {
  return (
    <SudobilityAppWithFirebaseAuth
      AppProviders={AppProviders}
      baseUrl={CONSTANTS.API_URL}
      testMode={CONSTANTS.DEV_MODE}
    >
      <AppRoutes />
    </SudobilityAppWithFirebaseAuth>
  );
}

export default App;
