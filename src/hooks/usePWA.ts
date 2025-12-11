/**
 * PWA Hook - Handle service worker registration and install prompt
 */

import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface UsePWAResult {
  /** Whether the app needs to be updated */
  needRefresh: boolean;
  /** Whether the app is offline-ready */
  offlineReady: boolean;
  /** Whether the app can be installed */
  canInstall: boolean;
  /** Update the service worker */
  updateServiceWorker: () => void;
  /** Dismiss the update prompt */
  dismissUpdate: () => void;
  /** Trigger the install prompt */
  installApp: () => Promise<void>;
  /** Dismiss the install prompt */
  dismissInstall: () => void;
}

/**
 * Hook for PWA functionality
 *
 * @example
 * ```tsx
 * const { needRefresh, offlineReady, canInstall, updateServiceWorker, installApp } = usePWA();
 *
 * if (needRefresh) {
 *   return <button onClick={updateServiceWorker}>Update Available</button>;
 * }
 *
 * if (canInstall) {
 *   return <button onClick={installApp}>Install App</button>;
 * }
 * ```
 */
export function usePWA(): UsePWAResult {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered:', registration);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Listen for app installed event
  useEffect(() => {
    const handler = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handler);

    return () => {
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  const dismissInstall = useCallback(() => {
    setCanInstall(false);
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setCanInstall(false);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    needRefresh,
    offlineReady,
    canInstall,
    updateServiceWorker: () => updateServiceWorker(true),
    dismissUpdate,
    installApp,
    dismissInstall,
  };
}
