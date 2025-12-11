import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Initialize i18n
import './i18n';

// CRITICAL: Initialize DI services BEFORE importing App
import { initializeStorageService, initializeNetworkService } from '@sudobility/di';
initializeStorageService();
initializeNetworkService();

// Import App AFTER DI initialization
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
