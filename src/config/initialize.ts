/**
 * @fileoverview Consolidated app initialization
 * @description Single entry point for all DI singletons and service initializations
 */

import { initializeWebApp } from '@sudobility/di_web';
import { registerServiceWorker } from '../utils/serviceWorker';
import { initWebVitals } from '../utils/webVitals';

/**
 * Initialize all app services and singletons.
 * Must be called before rendering the React app.
 * Note: i18n is initialized via import in main.tsx
 */
export async function initializeApp(): Promise<void> {
  await initializeWebApp({
    firebaseConfig: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    },
    enableFirebaseAuth: true,
    revenueCatConfig: {
      apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
      apiKeySandbox: import.meta.env.VITE_REVENUECAT_API_KEY_SANDBOX,
      isProduction: import.meta.env.MODE === 'production',
    },
    registerServiceWorker,
    initWebVitals,
  });
}
