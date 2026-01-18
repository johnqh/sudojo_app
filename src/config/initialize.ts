/**
 * @fileoverview Consolidated app initialization
 * @description Single entry point for all DI singletons and service initializations
 */

import {
  initializeStorageService,
  initializeNetworkService,
} from "@sudobility/di";
import { initializeInfoService } from "@sudobility/di_web";
import { initializeFirebaseAuth } from "@sudobility/auth_lib";
import {
  initializeSubscription,
  configureRevenueCatAdapter,
  createRevenueCatAdapter,
} from "@sudobility/subscription_lib";
import { registerServiceWorker } from "../utils/serviceWorker";
import { initWebVitals } from "../utils/webVitals";

/**
 * Initialize all app services and singletons.
 * Must be called before rendering the React app.
 *
 * Initialization order:
 * 1. DI services (storage, network, info)
 * 2. Firebase Auth
 * 3. Subscription (RevenueCat)
 * 4. i18n (imported separately)
 * 5. Performance monitoring (service worker, web vitals)
 */
export function initializeApp(): void {
  // 1. Initialize DI services
  initializeStorageService();
  initializeNetworkService();
  initializeInfoService();

  // 2. Initialize Firebase Auth
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

  // 3. Initialize Subscription (RevenueCat) - SDK is lazily loaded when first needed
  configureRevenueCatAdapter(
    import.meta.env.MODE === "production"
      ? import.meta.env.VITE_REVENUECAT_API_KEY
      : import.meta.env.VITE_REVENUECAT_API_KEY_SANDBOX
  );
  initializeSubscription({
    adapter: createRevenueCatAdapter(),
    freeTier: { packageId: "free", name: "Free" },
  });

  // 4. i18n is initialized via import in main.tsx

  // 5. Initialize performance monitoring
  registerServiceWorker();
  initWebVitals();
}
