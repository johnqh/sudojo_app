/**
 * Analytics Service - Re-export from di_web
 *
 * Usage: analyticsService.trackEvent('button_click', { button_name: 'submit' })
 */

import { getAnalyticsService, type AnalyticsEventParams } from '@sudobility/di_web';

export type { AnalyticsEventParams };

/**
 * Analytics service singleton - lazy accessor that delegates to di_web
 */
export const analyticsService = {
  trackEvent(eventName: string, params?: AnalyticsEventParams): void {
    try {
      getAnalyticsService().trackEvent(eventName, params);
    } catch {
      // Analytics not initialized
    }
  },
  trackPageView(pagePath: string, pageTitle?: string): void {
    try {
      getAnalyticsService().trackPageView(pagePath, pageTitle);
    } catch {
      // Analytics not initialized
    }
  },
  trackButtonClick(buttonName: string, params?: AnalyticsEventParams): void {
    try {
      getAnalyticsService().trackButtonClick(buttonName, params);
    } catch {
      // Analytics not initialized
    }
  },
  trackLinkClick(linkUrl: string, linkText?: string, params?: AnalyticsEventParams): void {
    try {
      getAnalyticsService().trackLinkClick(linkUrl, linkText, params);
    } catch {
      // Analytics not initialized
    }
  },
  trackError(errorMessage: string, errorCode?: string): void {
    try {
      getAnalyticsService().trackError(errorMessage, errorCode);
    } catch {
      // Analytics not initialized
    }
  },
  isEnabled(): boolean {
    try {
      return getAnalyticsService().isEnabled();
    } catch {
      return false;
    }
  },
};
