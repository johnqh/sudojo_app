/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import packageJson from './package.json';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'react-helmet-async',
      '@sudobility/subscription-components',
      '@sudobility/auth-components',
      '@sudobility/entity_client',
      '@sudobility/components',
      '@sudobility/building_blocks',
      'firebase',
      'firebase/app',
      'firebase/analytics',
      'firebase/auth',
      'firebase/remote-config',
      'firebase/messaging',
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Ensure all packages use the same subscription-components instance
      '@sudobility/subscription-components': path.resolve(
        __dirname,
        'node_modules/@sudobility/subscription-components',
      ),
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
          // React core + router together to avoid circular dependency
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react-vendor';
          }

          // React Query
          if (id.includes('node_modules/@tanstack/')) {
            return 'query';
          }

          // Radix UI
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-ui';
          }

          // Firebase - separate chunk for lazy loading potential
          if (id.includes('node_modules/firebase/')) {
            return 'firebase';
          }

          // RevenueCat - lazy loaded chunk (loaded only for authenticated users)
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
          if (id.includes('node_modules/@heroicons/')) {
            return 'icons';
          }

          // Sudobility sudojo-specific packages (smaller, game-specific)
          if (id.includes('node_modules/@sudobility/sudojo_lib')) {
            return 'sudobility-sudojo-lib';
          }
          if (id.includes('node_modules/@sudobility/sudojo_client')) {
            return 'sudojo-client';
          }
          if (id.includes('node_modules/@sudobility/sudojo_types')) {
            return 'sudojo-types';
          }

          // All other @sudobility packages in one chunk (they have interdependencies)
          if (id.includes('node_modules/@sudobility/')) {
            return 'sudobility-core';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@sudobility/components',
      'firebase/app',
      'firebase/analytics',
      'firebase/auth',
      'firebase/remote-config',
      'firebase/messaging',
    ],
    // Exclude packages that should be lazy loaded
    exclude: ['@sudobility/sudojo_client', '@sudobility/subscription-components'],
  },
  server: {
    host: true,
    port: 5193,
    watch: {
      ignored: ['!**/node_modules/@sudobility/**'],
    },
    fs: {
      // Allow serving files from linked packages in parent directory
      allow: ['..'],
    },
  },
});
