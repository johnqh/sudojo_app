/**
 * PWA Install Prompt Component
 *
 * Shows banners for:
 * - App install prompt
 * - Update available prompt
 * - Offline ready notification
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@sudobility/components';
import { usePWA } from '@/hooks/usePWA';

export default function InstallPrompt() {
  const { t } = useTranslation();
  const {
    needRefresh,
    offlineReady,
    canInstall,
    updateServiceWorker,
    dismissUpdate,
    installApp,
    dismissInstall,
  } = usePWA();

  const [showOfflineReady, setShowOfflineReady] = useState(false);

  // Show offline ready notification briefly
  useEffect(() => {
    if (offlineReady) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowOfflineReady(true);
      const timeout = setTimeout(() => {
        setShowOfflineReady(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [offlineReady]);

  // Update available banner
  if (needRefresh) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Text weight="medium" className="text-white">
                {t('pwa.updateAvailable')}
              </Text>
              <Text size="sm" className="text-blue-100 mt-1">
                {t('pwa.updateDescription')}
              </Text>
            </div>
            <button
              onClick={dismissUpdate}
              className="text-blue-200 hover:text-white"
              aria-label={t('pwa.dismiss')}
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={updateServiceWorker}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              {t('pwa.update')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissUpdate}
              className="text-white hover:bg-blue-700"
            >
              {t('pwa.later')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Install app banner
  if (canInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Text weight="medium">
                {t('pwa.installTitle')}
              </Text>
              <Text size="sm" color="muted" className="mt-1">
                {t('pwa.installDescription')}
              </Text>
            </div>
            <button
              onClick={dismissInstall}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              aria-label={t('pwa.dismiss')}
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="sm" onClick={installApp}>
              {t('pwa.install')}
            </Button>
            <Button variant="ghost" size="sm" onClick={dismissInstall}>
              {t('pwa.notNow')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Offline ready notification
  if (showOfflineReady) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        <div className="bg-green-600 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">✓</span>
            <Text className="text-white">
              {t('pwa.offlineReady')}
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
