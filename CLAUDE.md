# CLAUDE.md

This file provides context for AI assistants working on this codebase.

## Project Overview

`sudojo_app` is the main web application for Sudojo, a Sudoku learning platform. Built with React + Vite, it provides:
- Daily puzzle challenges
- Progressive difficulty levels
- Technique-based learning system
- Hint system with step-by-step explanations
- User authentication via Firebase
- Subscription management via RevenueCat
- PWA support for offline play

## Runtime & Package Manager

**This project uses Bun.** Do not use npm, yarn, or pnpm.

```bash
bun install           # Install dependencies
bun run dev           # Start dev server (Vite)
bun run build         # Build for production (tsc + vite build)
bun run preview       # Preview production build
bun run test          # Run tests once (vitest)
bun run test:watch    # Run tests in watch mode
bun run test:coverage # Run tests with coverage
bun run lint          # Run ESLint
```

## Tech Stack

- **Runtime**: Bun
- **Build**: Vite + TypeScript
- **Framework**: React 19
- **Routing**: react-router-dom v7
- **State**: Zustand + React Query
- **Styling**: Tailwind CSS + Radix UI
- **i18n**: i18next with language detection
- **Auth**: Firebase + @sudobility/auth-components
- **Payments**: RevenueCat
- **PWA**: vite-plugin-pwa + Workbox

## Project Structure

```
src/
├── App.tsx              # Root component with routing
├── main.tsx             # Entry point
├── i18n.ts              # i18next configuration
├── index.css            # Global styles (Tailwind)
├── components/          # Shared components
│   ├── layout/          # TopBar, Footer, etc.
│   └── ui/              # Reusable UI components
├── pages/               # Route pages
│   ├── HomePage.tsx
│   ├── DailyPage.tsx
│   ├── LevelsPage.tsx
│   ├── TechniquesPage.tsx
│   ├── SettingsPage.tsx
│   └── ...
├── hooks/               # Custom React hooks
├── context/             # React contexts
├── stores/              # Zustand stores
├── config/              # App configuration
├── utils/               # Utility functions
├── di/                  # Dependency injection setup
├── types/               # TypeScript types
├── data/                # Static data
└── test/                # Test setup and utilities
public/                  # Static assets
  ├── locales/           # Translation files (en, zh, etc.)
  └── icons/             # App icons
```

## Key Dependencies

### Sudobility Packages
- `@sudobility/components` - Shared UI component library
- `@sudobility/building_blocks` - Higher-level UI blocks (TopBar, Footer)
- `@sudobility/auth-components` - Firebase auth UI
- `@sudobility/subscription-components` - RevenueCat subscription UI
- `@sudobility/sudojo_client` - API client hooks
- `@sudobility/sudojo_lib` - Business logic
- `@sudobility/sudojo_types` - Type definitions
- `@sudobility/di` / `@sudobility/di_web` - Dependency injection

### External
- `@tanstack/react-query` - Server state management
- `@radix-ui/*` - Accessible UI primitives
- `zustand` - Client state management
- `react-helmet-async` - Document head management

## Patterns

### Routing
```typescript
// Localized routes with language prefix
<Route path="/:lang/daily" element={<DailyPage />} />

// Use LocalizedLink for navigation
import { LocalizedLink } from '@/components/layout/LocalizedLink';
<LocalizedLink to="/daily">Daily</LocalizedLink>
```

### State Management
```typescript
// Zustand for client state
import { useGameStore } from '@/stores/gameStore';
const { board, setCell } = useGameStore();

// React Query for server state
import { useDailyPuzzle } from '@sudobility/sudojo_client';
const { data, isLoading } = useDailyPuzzle();
```

### Internationalization
```typescript
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  return <h1>{t('daily.title')}</h1>;
}
```

Translation files are in `public/locales/{lang}/translation.json`.

### Styling
Uses Tailwind CSS with class-variance-authority for component variants:
```typescript
import { cn } from '@/utils/cn';
import { cva } from 'class-variance-authority';

const buttonVariants = cva('base-classes', {
  variants: { size: { sm: '...', lg: '...' } }
});
```

## Testing

Tests use Vitest with happy-dom and @testing-library/react:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('should render', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeDefined();
  });
});
```

Test setup is in `src/test/setup.ts` with mocks for browser APIs.

## Environment Variables

Create `.env.local` with:
```
VITE_API_URL=https://api.sudojo.com
VITE_SOLVER_URL=https://solver.sudojo.com
VITE_FIREBASE_*=...
VITE_REVENUECAT_*=...
```

## Common Tasks

### Add New Page
1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link if needed
4. Add translations in `public/locales/`

### Add New Component
1. Create in `src/components/` (or use from @sudobility/components)
2. Use Tailwind for styling
3. Add to relevant page or layout

### Update Translations
1. Edit `public/locales/{lang}/translation.json`
2. Use `t('key.path')` in components

### Debug
```bash
bun run dev    # Vite dev server with HMR
# Open browser DevTools
# React Query DevTools available in dev mode
```
