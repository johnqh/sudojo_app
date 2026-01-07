import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'Sudojo - Master Sudoku',
        short_name: 'Sudojo',
        description: 'Master Sudoku, One Technique at a Time',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.sudojo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/solver\.sudojo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'solver-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: id => {
          // React core
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }

          // React Query
          if (id.includes('node_modules/@tanstack/')) {
            return 'query';
          }

          // Radix UI
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-ui';
          }

          // Firebase
          if (id.includes('node_modules/firebase/')) {
            return 'firebase';
          }

          // RevenueCat Purchases
          if (id.includes('node_modules/@revenuecat/')) {
            return 'revenuecat';
          }

          // i18next
          if (id.includes('node_modules/i18next')) {
            return 'i18n';
          }

          // UI utilities
          if (
            id.includes('node_modules/class-variance-authority') ||
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge')
          ) {
            return 'ui-utils';
          }

          // Icons
          if (id.includes('node_modules/@heroicons/') || id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // Sudobility packages - split by package
          if (id.includes('node_modules/@sudobility/components')) {
            return 'sudobility-components';
          }
          if (id.includes('node_modules/@sudobility/sudojo_lib')) {
            return 'sudobility-sudojo-lib';
          }
          if (id.includes('node_modules/@sudobility/sudojo_client')) {
            return 'sudojo-client';
          }
          if (id.includes('node_modules/@sudobility/sudojo_types')) {
            return 'sudojo-types';
          }
          if (id.includes('node_modules/@sudobility/')) {
            return 'sudobility-core';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@sudobility/components'],
    exclude: ['@sudobility/sudojo_client'],
  },
  server: {
    host: true,
    port: 5193,
    watch: {
      ignored: ['!**/node_modules/@sudobility/**'],
    },
  },
});
