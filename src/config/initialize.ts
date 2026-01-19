/**
 * @fileoverview Consolidated app initialization
 * @description Single entry point for all DI singletons and service initializations
 */

import { initializeStorageService, initializeNetworkService } from '@sudobility/di';
import { initializeInfoService } from '@sudobility/di_web';
import {
  initializeFirebaseAuth,
  FirebaseAuthNetworkService,
} from '@sudobility/auth_lib';
import {
  initializeSubscription,
  configureRevenueCatAdapter,
  createRevenueCatAdapter,
} from '@sudobility/subscription_lib';
import { registerServiceWorker } from '../utils/serviceWorker';
import { initWebVitals } from '../utils/webVitals';

/**
 * Initialize all app services and singletons.
 * Must be called before rendering the React app.
 *
 * Initialization order:
 * 1. Storage service
 * 2. Firebase Auth (needed before network service for token refresh)
 * 3. Network service (with Firebase auth retry logic)
 * 4. Info service
 * 5. Subscription (RevenueCat)
 * 6. i18n (imported separately)
 * 7. Performance monitoring (service worker, web vitals)
 */
export function initializeApp(): void {
  // 1. Initialize storage service
  initializeStorageService();

  // 2. Initialize Firebase Auth first (needed by network service for token refresh)
  initializeFirebaseAuth({
    config: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    },
  });

  // 3. Initialize network service with Firebase auth retry logic
  initializeNetworkService(new FirebaseAuthNetworkService());

  // 4. Initialize info service
  initializeInfoService();

  // 5. Initialize Subscription (RevenueCat) - SDK is lazily loaded when first needed
  configureRevenueCatAdapter(
    import.meta.env.MODE === 'production'
      ? import.meta.env.VITE_REVENUECAT_API_KEY
      : import.meta.env.VITE_REVENUECAT_API_KEY_SANDBOX
  );
  initializeSubscription({
    adapter: createRevenueCatAdapter(),
    freeTier: { packageId: 'free', name: 'Free' },
  });

  // 6. i18n is initialized via import in main.tsx

  // 7. Initialize performance monitoring
  registerServiceWorker();
  initWebVitals();
}
