import { type ReactNode } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { SudobilityAppWithFirebaseAuth } from '@sudobility/building_blocks/firebase';
import { CONSTANTS } from './config/constants';
import { PerformancePanel } from '@sudobility/components';
import { SettingsProvider } from './context/SettingsContext';
import { ProgressProvider } from './context/ProgressContext';
import { SubscriptionProviderWrapper } from './components/providers/SubscriptionProviderWrapper';

// Pages (lazy loaded)
import { lazy, Suspense } from 'react';

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

// Combined app-specific providers (ApiProvider is built into SudobilityAppWithFirebaseAuth)
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <SubscriptionProviderWrapper>
          {children}
        </SubscriptionProviderWrapper>
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
