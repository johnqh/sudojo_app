# Sudojo App - Implementation Plan

## Overview
Modern TypeScript React Sudoku game and teaching app, following mail_box coding patterns with @sudobility component library.

---

## Phase 1: Project Setup

### 1.1 Initialize Vite Project
```bash
npm create vite@latest . -- --template react-ts
```

### 1.2 Install Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.x",
    "@tanstack/react-query": "^5.x",
    "i18next": "^24.x",
    "react-i18next": "^15.x",
    "i18next-browser-languagedetector": "^8.x",
    "i18next-http-backend": "^3.x",
    "firebase": "^11.x",
    "firebaseui": "^6.x",

    "@sudobility/types": "latest",
    "@sudobility/di": "latest",
    "@sudobility/design": "latest",
    "@sudobility/components": "latest",
    "@sudobility/sudojo_types": "latest",

    "sudojo_lib": "file:../sudojo_lib",
    "sudojo_client": "file:../sudojo_client",
    "sudojo_solver_client": "file:../sudojo_solver_client"
  },
  "devDependencies": {
    "tailwindcss": "^4.x",
    "@tailwindcss/vite": "^4.x",
    "typescript": "~5.7.x"
  }
}
```

### 1.3 Configure Tailwind
- Follow mail_box pattern with Tailwind v4
- Configure dark mode: `darkMode: 'class'`
- Import design tokens from @sudobility/design

### 1.4 Configure TypeScript
- Strict mode enabled
- Path aliases: `@/*` -> `src/*`

---

## Phase 2: Core Architecture

### 2.1 Project Structure
```
src/
├── main.tsx              # Entry with DI initialization
├── App.tsx               # Routes + Providers
├── i18n.ts               # i18next config
├── index.css             # Tailwind + CSS variables
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx
│   │   ├── Footer.tsx
│   │   └── ScreenContainer.tsx
│   ├── sudoku/
│   │   ├── SudokuCanvas.tsx      # Responsive canvas board
│   │   ├── SudokuControls.tsx    # Number pad + actions
│   │   └── SudokuGame.tsx        # Game container
│   └── auth/
│       ├── LoginButton.tsx
│       └── AuthProvider.tsx
├── config/
│   ├── app.ts            # API URLs, constants
│   ├── constants.ts      # CONSTANTS factory
│   └── firebase.ts       # Firebase config
├── context/
│   ├── ThemeContext.tsx
│   └── LanguageContext.tsx
├── di/
│   └── env.web.ts        # WebEnvProvider
├── hooks/
│   ├── useLocalizedNavigate.ts
│   ├── useBreadcrumbs.ts
│   └── shared/           # Global state hooks
├── pages/
│   ├── HomePage.tsx
│   ├── DailyPage.tsx
│   ├── LevelsPage.tsx
│   ├── LevelPlayPage.tsx
│   ├── TechniquesPage.tsx
│   └── SettingsPage.tsx
├── utils/
│   └── BreadcrumbBuilder.ts
└── public/
    └── locales/
        ├── en/common.json
        └── zh/common.json
```

### 2.2 DI Initialization (main.tsx)
```typescript
// Initialize DI BEFORE importing App (mail_box pattern)
import { initializeStorageService, initializeNetworkService } from '@sudobility/di';

initializeStorageService();
initializeNetworkService();

// Then import App
import App from './App';
```

### 2.3 Provider Hierarchy (App.tsx)
```typescript
<HelmetProvider>
  <I18nextProvider i18n={i18n}>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <FirebaseProvider>
          <BrowserRouter>
            <Routes>...</Routes>
          </BrowserRouter>
        </FirebaseProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </I18nextProvider>
</HelmetProvider>
```

---

## Phase 3: Routing & Localization

### 3.1 URL Pattern
`/:lang/path` (e.g., `/en/daily`, `/zh/techniques`)

### 3.2 Route Structure
```typescript
<Routes>
  <Route path="/" element={<LanguageRedirect />} />
  <Route path="/:lang" element={<LanguageValidator />}>
    <Route index element={<HomePage />} />
    <Route path="daily" element={<DailyPage />} />
    <Route path="levels" element={<LevelsPage />} />
    <Route path="levels/:levelId" element={<LevelPlayPage />} />
    <Route path="techniques" element={<TechniquesPage />} />
    <Route path="techniques/:techniqueId" element={<TechniquesPage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
</Routes>
```

### 3.3 Supported Languages
Start with: `en`, `zh` (expandable)

### 3.4 i18n Setup
- Backend: Load from `/locales/{lang}/common.json`
- Detection: path > localStorage > navigator
- Fallback: `en`

---

## Phase 4: Layout Components

### 4.1 TopBar
Using `@sudobility/components` Topbar:
```
[Logo] | [Daily] [Levels v] [Techniques] [Settings] | [Lang] [Login]
```

**Structure:**
- Left: Logo + TopbarNavigation
- Center: (empty or search in future)
- Right: LanguageSelector + LoginButton

**Levels Dropdown:**
- Use TopbarNavItem with `children` for dropdown menu
- Items: Level 1, Level 2, ... (from API)

### 4.2 Footer
- **HomePage**: Full footer (`FooterGrid` with links, social, copyright)
- **Other pages**: Compact sticky footer (`FooterCompact`)

### 4.3 Breadcrumbs
- Use `Breadcrumb` from @sudobility/components
- Path-to-label mapping via `BreadcrumbBuilder`
- Show below TopBar on non-home pages

### 4.4 Max Width Constraint
- Use `ui.layout.container` from @sudobility/design
- Pattern: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

---

## Phase 5: Pages

### 5.1 HomePage
- Hero section with app description
- Quick links to Daily, Levels, Techniques
- Full footer

### 5.2 DailyPage
- Fetch today's puzzle: `useSudojoTodayDaily()`
- Display SudokuGame component
- Share/stats when completed

### 5.3 LevelsPage
- List of levels from `useSudojoLevels()`
- Click level -> navigate to LevelPlayPage

### 5.4 LevelPlayPage (`/levels/:levelId`)
- Fetch random board for level: `useSudojoRandomBoard({ level_uuid })`
- Display SudokuGame component
- "Next Puzzle" button when completed

### 5.5 TechniquesPage (Master-Detail)
Using `MasterDetailLayout` from @sudobility/components:
- **Master**: List of techniques from `useSudojoTechniques()`
- **Detail**: Learning content from `useSudojoLearning({ technique_uuid })`
- **Mobile**: Stacked navigation (list -> detail)
- URL: `/techniques` (list) or `/techniques/:techniqueId` (with selection)

### 5.6 SettingsPage
Settings from sodojo-web:
- **Show Errors**: Toggle to highlight incorrect entries
- **Symmetrical Puzzles**: Toggle for puzzle generation
- **Display Format**: Dropdown (Numeric, Kanji, Emojis)

Store in localStorage via @sudobility/di storage service.

---

## Phase 6: Sudoku Game Components

### 6.1 SudokuCanvas (Responsive)
Port from sodojo-web with improvements:
- Use `useSudoku()` hook from sudojo_lib
- Responsive sizing: fit container with aspect-ratio: 1
- Max size constraint (e.g., 500px)
- Canvas layers:
  1. Background (cell colors, selection highlight)
  2. Grid lines (block borders thicker)
  3. Numbers (given vs user input styling)
  4. Pencilmarks (smaller, positioned in 3x3 grid within cell)
  5. Error highlighting (when enabled)

**Rendering approach:**
```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
const containerRef = useRef<HTMLDivElement>(null);

// Resize observer for responsive canvas
useEffect(() => {
  const observer = new ResizeObserver(entries => {
    const { width } = entries[0].contentRect;
    const size = Math.min(width, MAX_SIZE);
    // Update canvas size and redraw
  });
  observer.observe(containerRef.current);
}, []);
```

### 6.2 SudokuControls
- **Number Pad**: Buttons 1-9 using `Button` component
- **Actions Row**:
  - Undo button
  - Erase button
  - Pencil mode toggle
  - Auto-pencilmarks button
- **Hints** (future): Hint button + navigation

### 6.3 SudokuGame (Container)
Combines:
- SudokuCanvas
- SudokuControls
- Game state from `useSudoku()` hook
- Teaching state from `useGameTeaching()` hook (for hints)

---

## Phase 7: State Management

### 7.1 Game State
Use `useSudoku()` hook from sudojo_lib:
```typescript
const {
  play,           // SudokuPlay state
  board,          // Current board (81 cells)
  selectedCell,   // Selected cell index
  isPencilMode,
  isCompleted,
  canUndo,
  errorCells,
  progress,
  // Actions
  loadBoard,
  selectCell,
  input,
  erase,
  togglePencilMode,
  undo,
  autoPencilmarks,
  reset,
} = useSudoku();
```

### 7.2 App Settings
Use `createGlobalState` pattern (from mail_box):
```typescript
export const useAppSettings = createGlobalState<SudokuAppSettings>(
  'sudojoAppSettings',
  DEFAULT_APP_SETTINGS
);
```

### 7.3 Theme State
ThemeContext with localStorage persistence:
- Values: 'light' | 'dark' | 'system'
- Apply via document.documentElement.classList

---

## Phase 8: Authentication

### 8.1 Firebase Setup
- Configure Firebase project
- Enable Email/Password and Google sign-in

### 8.2 FirebaseUI Integration
LoginButton component:
```typescript
import * as firebaseui from 'firebaseui';

// Show FirebaseUI in modal when clicked
const uiConfig = {
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
  signInFlow: 'popup',
  callbacks: {
    signInSuccessWithAuthResult: () => false, // Don't redirect
  },
};
```

### 8.3 Auth Context
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
```

---

## Phase 9: Dark/Light Mode

### 9.1 ThemeContext
Following mail_box pattern:
- Store preference in localStorage
- Apply 'dark' class to html element
- Listen for system preference changes

### 9.2 CSS Variables
```css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #111827;
  /* ... */
}

.dark {
  --color-bg-primary: #0f172a;
  --color-text-primary: #f1f5f9;
  /* ... */
}
```

### 9.3 Sudoku Canvas Colors
Define color scheme for both modes:
```typescript
const colors = {
  light: {
    background: '#ffffff',
    gridLine: '#e5e7eb',
    blockBorder: '#111827',
    cellSelected: '#bfdbfe',
    cellRelated: '#f3f4f6',
    textGiven: '#111827',
    textInput: '#3b82f6',
    textError: '#ef4444',
    pencilmark: '#6b7280',
  },
  dark: {
    background: '#1e293b',
    gridLine: '#334155',
    blockBorder: '#e2e8f0',
    cellSelected: '#1e40af',
    cellRelated: '#334155',
    textGiven: '#f1f5f9',
    textInput: '#60a5fa',
    textError: '#f87171',
    pencilmark: '#94a3b8',
  },
};
```

---

## Phase 10: API Integration

### 10.1 Client Setup
```typescript
import { networkClient } from '@sudobility/di';
import { createSudojoClient } from 'sudojo_client';
import { createSudojoSolverClient } from 'sudojo_solver_client';

export const sudojoClient = createSudojoClient(networkClient, {
  baseUrl: import.meta.env.VITE_SUDOJO_API_URL,
});

export const solverClient = createSudojoSolverClient(networkClient, {
  baseUrl: import.meta.env.VITE_SOLVER_API_URL,
});
```

### 10.2 React Query Setup
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
    },
  },
});
```

---

## Implementation Order

### Sprint 1: Foundation
1. [ ] Initialize Vite project with dependencies
2. [ ] Configure Tailwind, TypeScript, path aliases
3. [ ] Set up DI initialization pattern
4. [ ] Create basic routing with language support
5. [ ] Implement ThemeContext (dark/light mode)
6. [ ] Create ScreenContainer with TopBar + Footer

### Sprint 2: Layout & Navigation
7. [ ] Implement TopBar with navigation items
8. [ ] Implement Levels dropdown menu
9. [ ] Implement LanguageSelector
10. [ ] Implement Breadcrumbs
11. [ ] Create HomePage with hero + links
12. [ ] Implement full and compact Footer

### Sprint 3: Sudoku Core
13. [ ] Create responsive SudokuCanvas component
14. [ ] Integrate useSudoku hook from sudojo_lib
15. [ ] Implement cell selection + input
16. [ ] Create SudokuControls (number pad + actions)
17. [ ] Create SudokuGame container

### Sprint 4: Pages
18. [ ] Implement DailyPage with API integration
19. [ ] Implement LevelsPage
20. [ ] Implement LevelPlayPage
21. [ ] Implement TechniquesPage with MasterDetailLayout
22. [ ] Implement SettingsPage

### Sprint 5: Polish
23. [ ] Add Firebase authentication
24. [ ] Implement hints system (using solver client)
25. [ ] Add completion celebration
26. [ ] Responsive testing and fixes
27. [ ] Localization strings

---

## Critical Files to Reference

### mail_box patterns:
- `~/0xmail/mail_box/src/main.tsx` - DI initialization
- `~/0xmail/mail_box/src/App.tsx` - Provider hierarchy, routing
- `~/0xmail/mail_box/src/i18n.ts` - i18next config
- `~/0xmail/mail_box/src/components/TopBar.tsx` - TopBar implementation
- `~/0xmail/mail_box/src/components/Footer.tsx` - Footer variants
- `~/0xmail/mail_box/src/context/ThemeContext.tsx` - Theme management
- `~/0xmail/mail_box/src/hooks/useLocalizedNavigate.ts` - Localized routing

### sodojo-web features:
- `~/sudojo/sudojo-web/src/sudokurenderer/renderer/SudokuView.tsx` - Canvas rendering
- `~/sudojo/sudojo-web/src/App.tsx` - View mapping, routes

### Libraries:
- `~/sudojo/sudojo_lib/src/hooks/useSudoku.ts` - Game state hook
- `~/sudojo/sudojo_client/src/hooks/` - API hooks
- `~/sudojo/sudojo_solver_client/src/hooks/` - Solver hooks

---

## Questions Resolved
- Components from @sudobility/components via npm
- Canvas: Responsive with max size constraint
- Techniques: MasterDetailLayout with mobile stacked navigation
- Project: Create from scratch with Vite

## Environment Variables (.env)
```bash
# Firebase (same pattern as mail_box)
VITE_FIREBASE_API_KEY=AIzaSyDSBvTAdcZeYqyiDWETbLGsuIyVM5FRnAI
VITE_FIREBASE_AUTH_DOMAIN=sudojo-development.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sudojo-development
VITE_FIREBASE_STORAGE_BUCKET=sudojo-development.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=757700548986
VITE_FIREBASE_APP_ID=1:757700548986:web:8123e006626089d118dec3
VITE_FIREBASE_MEASUREMENT_ID=G-M380VEB1RK

# API URLs
VITE_SUDOJO_API_URL=https://api.sudojo.com  # Update with actual URL
VITE_SOLVER_API_URL=https://solver.sudojo.com  # Update with actual URL
```

## Open Items
- Logo asset for TopBar
- Specific localization strings
- Actual API URLs (to be set in .env)
