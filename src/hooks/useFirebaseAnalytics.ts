/**
 * Firebase Analytics hook for sudojo_app.
 * Provides analytics tracking methods using Firebase Analytics.
 */
import { useCallback } from 'react';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';
import { getFirebaseApp } from '@sudobility/auth_lib';

// Check if analytics is configured (has measurementId)
const IS_ANALYTICS_ENABLED = !!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

// Analytics instance (initialized lazily)
let analyticsInstance: Analytics | null = null;
let analyticsInitialized = false;

const getAnalyticsInstance = async (): Promise<Analytics | null> => {
  if (analyticsInstance) return analyticsInstance;
  if (analyticsInitialized) return null;
  if (!IS_ANALYTICS_ENABLED) {
    analyticsInitialized = true;
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      analyticsInitialized = true;
      return null;
    }

    const app = getFirebaseApp();
    if (!app) {
      analyticsInitialized = true;
      return null;
    }

    analyticsInstance = getAnalytics(app);
    analyticsInitialized = true;
    return analyticsInstance;
  } catch {
    analyticsInitialized = true;
    return null;
  }
};

// Initialize analytics on module load
if (typeof window !== 'undefined' && IS_ANALYTICS_ENABLED) {
  getAnalyticsInstance();
}

/**
 * Hook for Firebase Analytics tracking.
 */
export function useFirebaseAnalytics() {
  const trackEvent = useCallback(
    (eventName: string, parameters?: Record<string, unknown>) => {
      if (!IS_ANALYTICS_ENABLED) return;

      getAnalyticsInstance().then(analytics => {
        if (analytics) {
          logEvent(analytics, eventName, parameters);
        }
      });
    },
    []
  );

  const trackButtonClick = useCallback(
    (params: { button_text: string; component_name?: string; [key: string]: unknown }) => {
      trackEvent('button_click', {
        ...params,
        timestamp: Date.now(),
      });
    },
    [trackEvent]
  );

  const trackLinkClick = useCallback(
    (params: { link_text?: string; component_name?: string; [key: string]: unknown }) => {
      trackEvent('link_click', {
        ...params,
        timestamp: Date.now(),
      });
    },
    [trackEvent]
  );

  const trackPageView = useCallback(
    (pageName: string, pagePath: string) => {
      trackEvent('page_view', {
        page_name: pageName,
        page_path: pagePath,
        timestamp: Date.now(),
      });
    },
    [trackEvent]
  );

  return {
    isEnabled: IS_ANALYTICS_ENABLED,
    trackEvent,
    trackButtonClick,
    trackLinkClick,
    trackPageView,
  };
}
