# Current Game Feature Implementation Plan

## Overview

Introduce a "current game" concept that tracks whatever sudoku the user is playing (daily, level, or entered). When the user leaves the page, the game is paused and persisted. Users can resume from the "Play" menu via a "Continue Last Sudoku" button.

## Architecture

- **Business logic**: `sudojo_lib` - new `useGamePlay` hook with Zustand store
- **UI**: `sudojo_app` - consume the hook, show "Continue" button in LevelsPage

---

## Phase 1: sudojo_lib - Add useGamePlay Hook

### 1.1 Add Zustand Dependency

**File:** `sudojo_lib/package.json`

Add `zustand` as a peer dependency (already used by sudojo_app):
```json
"peerDependencies": {
  "zustand": ">=5.0.0",
  // ... existing peers
}
```

Also add to devDependencies for testing.

### 1.2 Create Types

**File:** `sudojo_lib/src/types/currentGame.ts` (new)

```typescript
/** Source of the current game */
export type GameSource = 'daily' | 'level' | 'entered';

/** Metadata for navigation back to the game */
export interface CurrentGameMeta {
  /** For daily games */
  dailyDate?: string;
  /** For level games */
  levelId?: string;
  /** Level title for display */
  levelTitle?: string;
}

/** Current game state stored in Zustand */
export interface CurrentGame {
  /** Game source type */
  source: GameSource;
  /** Original puzzle string (81 chars) */
  puzzle: string;
  /** Solution string (81 chars) */
  solution: string;
  /** Navigation metadata */
  meta: CurrentGameMeta;
  /** User's current input (81 chars, '0' = empty) */
  inputString: string;
  /** User's pencilmarks (comma-separated format) */
  pencilmarksString: string;
  /** Whether pencil mode was active */
  isPencilMode: boolean;
  /** Elapsed time in seconds */
  elapsedTime: number;
  /** When the game was started */
  startedAt: string;
  /** When last updated */
  updatedAt: string;
}
```

### 1.3 Create Zustand Store

**File:** `sudojo_lib/src/stores/gamePlayStore.ts` (new)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentGame, GameSource, CurrentGameMeta } from '../types/currentGame';

interface GamePlayState {
  /** Current game (null if none) */
  currentGame: CurrentGame | null;

  /** Start a new game - clears any existing game */
  startGame: (
    source: GameSource,
    puzzle: string,
    solution: string,
    meta?: CurrentGameMeta
  ) => void;

  /** Update game progress (call periodically during play) */
  updateProgress: (
    inputString: string,
    pencilmarksString: string,
    isPencilMode: boolean,
    elapsedTime: number
  ) => void;

  /** Clear current game (call on completion) */
  clearGame: () => void;

  /** Check if there's an active game */
  hasCurrentGame: () => boolean;
}

export const useGamePlayStore = create<GamePlayState>()(
  persist(
    (set, get) => ({
      currentGame: null,

      startGame: (source, puzzle, solution, meta = {}) => {
        const now = new Date().toISOString();
        set({
          currentGame: {
            source,
            puzzle,
            solution,
            meta,
            inputString: '0'.repeat(81),
            pencilmarksString: '',
            isPencilMode: false,
            elapsedTime: 0,
            startedAt: now,
            updatedAt: now,
          },
        });
      },

      updateProgress: (inputString, pencilmarksString, isPencilMode, elapsedTime) => {
        const current = get().currentGame;
        if (!current) return;

        set({
          currentGame: {
            ...current,
            inputString,
            pencilmarksString,
            isPencilMode,
            elapsedTime,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      clearGame: () => set({ currentGame: null }),

      hasCurrentGame: () => get().currentGame !== null,
    }),
    {
      name: 'sudojo-current-game',
    }
  )
);
```

### 1.4 Create useGamePlay Hook

**File:** `sudojo_lib/src/hooks/useGamePlay.ts` (new)

Wrapper hook that provides a clean API and auto-save functionality:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useGamePlayStore } from '../stores/gamePlayStore';
import type { GameSource, CurrentGameMeta, CurrentGame } from '../types/currentGame';

export interface UseGamePlayOptions {
  /** Debounce delay for auto-save in ms (default: 2000) */
  autoSaveDelay?: number;
}

export interface UseGamePlayResult {
  /** Current game state (null if none) */
  currentGame: CurrentGame | null;
  /** Whether there's an active game */
  hasCurrentGame: boolean;
  /** Start a new game */
  startGame: (
    source: GameSource,
    puzzle: string,
    solution: string,
    meta?: CurrentGameMeta
  ) => void;
  /** Update progress (debounced internally) */
  updateProgress: (
    inputString: string,
    pencilmarksString: string,
    isPencilMode: boolean,
    elapsedTime: number
  ) => void;
  /** Clear current game (call on completion) */
  clearGame: () => void;
}

export function useGamePlay(options: UseGamePlayOptions = {}): UseGamePlayResult {
  const { autoSaveDelay = 2000 } = options;
  const store = useGamePlayStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdate = useRef<Parameters<typeof store.updateProgress> | null>(null);

  // Debounced update
  const updateProgress = useCallback(
    (
      inputString: string,
      pencilmarksString: string,
      isPencilMode: boolean,
      elapsedTime: number
    ) => {
      pendingUpdate.current = [inputString, pencilmarksString, isPencilMode, elapsedTime];

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (pendingUpdate.current) {
          store.updateProgress(...pendingUpdate.current);
          pendingUpdate.current = null;
        }
      }, autoSaveDelay);
    },
    [store, autoSaveDelay]
  );

  // Flush pending updates on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pendingUpdate.current) {
        store.updateProgress(...pendingUpdate.current);
      }
    };
  }, [store]);

  return {
    currentGame: store.currentGame,
    hasCurrentGame: store.currentGame !== null,
    startGame: store.startGame,
    updateProgress,
    clearGame: store.clearGame,
  };
}
```

### 1.5 Export from Index

**File:** `sudojo_lib/src/index.ts`

Add exports:
```typescript
// Types
export type { CurrentGame, GameSource, CurrentGameMeta } from './types/currentGame';

// Hooks
export { useGamePlay } from './hooks/useGamePlay';
export type { UseGamePlayOptions, UseGamePlayResult } from './hooks/useGamePlay';

// Store (for direct access if needed)
export { useGamePlayStore } from './stores/gamePlayStore';
```

---

## Phase 2: sudojo_app - Integrate with Game Pages

### 2.1 Update SudokuGame Component

**File:** `sudojo_app/src/components/sudoku/SudokuGame.tsx`

Add optional props for current game integration:

```typescript
interface SudokuGameProps {
  puzzle: string;
  solution: string;
  showErrors?: boolean;
  showTimer?: boolean;
  onComplete?: (timeSeconds: number) => void;
  // New props for current game
  onProgressUpdate?: (
    inputString: string,
    pencilmarksString: string,
    isPencilMode: boolean,
    elapsedTime: number
  ) => void;
  initialInput?: string;
  initialPencilmarks?: string;
  initialElapsedTime?: number;
}
```

- Call `onProgressUpdate` after each move (already has `getInputString`, `getPencilmarksString`)
- Pass initial values to `useSudoku` if resuming

### 2.2 Update DailyPage

**File:** `sudojo_app/src/pages/DailyPage.tsx`

```typescript
import { useGamePlay } from '@sudobility/sudojo_lib';

// In component:
const { startGame, updateProgress, clearGame, currentGame } = useGamePlay();

// When game loads successfully:
useEffect(() => {
  if (status === 'success' && daily && dailyDate) {
    // Check if resuming same game
    const isResume = currentGame?.source === 'daily' &&
                     currentGame?.meta.dailyDate === dailyDate;
    if (!isResume) {
      startGame('daily', daily.board, daily.solution, { dailyDate });
    }
  }
}, [status, daily, dailyDate]);

// On completion:
const handleComplete = useCallback((timeSeconds: number) => {
  clearGame(); // Clear current game on completion
  if (dailyDate && !alreadyCompleted) {
    markCompleted({ type: 'daily', id: dailyDate, timeSeconds });
  }
}, [dailyDate, alreadyCompleted, markCompleted, clearGame]);

// Pass to SudokuGame:
<SudokuGame
  puzzle={daily.board}
  solution={daily.solution}
  onProgressUpdate={updateProgress}
  initialInput={isResume ? currentGame.inputString : undefined}
  initialPencilmarks={isResume ? currentGame.pencilmarksString : undefined}
  initialElapsedTime={isResume ? currentGame.elapsedTime : undefined}
  onComplete={handleComplete}
/>
```

### 2.3 Update LevelPlayPage

**File:** `sudojo_app/src/pages/LevelPlayPage.tsx`

Similar pattern to DailyPage:
- Call `startGame('level', board.board, board.solution, { levelId, levelTitle: level?.title })`
- Pass `updateProgress` to SudokuGame
- Call `clearGame()` on completion
- Handle resume if `currentGame?.meta.levelId === levelId`

### 2.4 Update EnterBoard

**File:** `sudojo_app/src/components/sudoku/EnterBoard.tsx`

- Call `startGame('entered', puzzle, solution, {})` when transitioning to play mode
- Pass `updateProgress` to SudokuGame
- Call `clearGame()` on completion or when going back to entry mode

---

## Phase 3: sudojo_app - Add Continue Button to LevelsPage

### 3.1 Update LevelsPage

**File:** `sudojo_app/src/pages/LevelsPage.tsx`

```typescript
import { useGamePlay } from '@sudobility/sudojo_lib';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';

// In component:
const { currentGame, hasCurrentGame } = useGamePlay();
const navigate = useLocalizedNavigate();

// Helper to get continue path
const getContinuePath = () => {
  if (!currentGame) return null;
  switch (currentGame.source) {
    case 'daily':
      return '/daily';
    case 'level':
      return `/play/${currentGame.meta.levelId}`;
    case 'entered':
      return '/play/enter';
  }
};

// Helper to get display text
const getContinueText = () => {
  if (!currentGame) return '';
  switch (currentGame.source) {
    case 'daily':
      return t('play.continueDaily');
    case 'level':
      return currentGame.meta.levelTitle
        ? t('play.continueLevel', { level: currentGame.meta.levelTitle })
        : t('play.continuePuzzle');
    case 'entered':
      return t('play.continueEntered');
  }
};

// In render, add before "Enter My Board":
{hasCurrentGame && (
  <LocalizedLink
    to={getContinuePath()!}
    className="flex items-center justify-between py-4 px-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-lg mb-2"
  >
    <div className="flex items-center gap-3">
      <PlayIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <div>
        <Text weight="medium" className="text-blue-600 dark:text-blue-400">
          {t('play.continue')}
        </Text>
        <Text size="sm" color="muted">
          {getContinueText()}
        </Text>
      </div>
    </div>
    <Text color="muted">→</Text>
  </LocalizedLink>
)}
```

### 3.2 Add Translations

**File:** `sudojo_app/public/locales/en/translation.json`

```json
{
  "play": {
    "continue": "Continue Last Sudoku",
    "continueDaily": "Daily Puzzle",
    "continueLevel": "{{level}}",
    "continuePuzzle": "Level Puzzle",
    "continueEntered": "Your Puzzle"
  }
}
```

Add same keys to other locale files (zh, etc.).

---

## Phase 4: Handle Resume Logic in useSudoku

### 4.1 Add loadBoardWithProgress Option

**File:** `sudojo_lib/src/hooks/useSudoku.ts`

Add option to `loadBoard` to restore progress:

```typescript
interface LoadBoardOptions {
  scramble?: boolean;
  // New options for resume
  initialInput?: string;
  initialPencilmarks?: string;
}
```

When `initialInput` is provided, apply it after loading the board.

---

## Files Summary

### New Files
| File | Package | Purpose |
|------|---------|---------|
| `src/types/currentGame.ts` | sudojo_lib | Type definitions |
| `src/stores/gamePlayStore.ts` | sudojo_lib | Zustand store with persistence |
| `src/hooks/useGamePlay.ts` | sudojo_lib | Hook wrapper with auto-save |

### Modified Files
| File | Package | Changes |
|------|---------|---------|
| `package.json` | sudojo_lib | Add zustand peer dep |
| `src/index.ts` | sudojo_lib | Export new types/hooks |
| `src/hooks/useSudoku.ts` | sudojo_lib | Add resume options to loadBoard |
| `src/components/sudoku/SudokuGame.tsx` | sudojo_app | Add progress callback & initial state props |
| `src/pages/DailyPage.tsx` | sudojo_app | Integrate useGamePlay |
| `src/pages/LevelPlayPage.tsx` | sudojo_app | Integrate useGamePlay |
| `src/components/sudoku/EnterBoard.tsx` | sudojo_app | Integrate useGamePlay |
| `src/pages/LevelsPage.tsx` | sudojo_app | Add Continue button |
| `public/locales/*/translation.json` | sudojo_app | Add translation keys |

---

## Implementation Order

1. **sudojo_lib**: Add types (`currentGame.ts`)
2. **sudojo_lib**: Add Zustand store (`gamePlayStore.ts`)
3. **sudojo_lib**: Add hook (`useGamePlay.ts`)
4. **sudojo_lib**: Update `useSudoku.ts` for resume
5. **sudojo_lib**: Export from index, update package.json
6. **sudojo_lib**: Build and publish
7. **sudojo_app**: Update SudokuGame component
8. **sudojo_app**: Update DailyPage
9. **sudojo_app**: Update LevelPlayPage
10. **sudojo_app**: Update EnterBoard
11. **sudojo_app**: Update LevelsPage with Continue button
12. **sudojo_app**: Add translations

---

## Verification

1. Start a daily puzzle, make some moves, navigate away
2. Go to Play menu - should see "Continue Last Sudoku" button
3. Click continue - should resume with previous progress
4. Complete the puzzle - Continue button should disappear
5. Repeat for level puzzles and entered puzzles
6. Refresh browser - current game should persist
7. Complete a game - should clear from storage
