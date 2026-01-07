import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// CRITICAL: Initialize DI services BEFORE importing App
import { initializeStorageService, initializeNetworkService } from '@sudobility/di';
import { initializeInfoService } from '@sudobility/di_web';
import { initializeFirebaseAuth } from '@sudobility/auth_lib';

initializeStorageService();
initializeNetworkService();
initializeInfoService();

// Initialize Firebase Auth
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

// Initialize i18n
import './i18n';

// Import App AFTER DI initialization
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
