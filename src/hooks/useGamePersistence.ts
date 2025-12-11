/**
 * Hook for persisting game state to localStorage
 *
 * Saves game progress automatically so users can resume where they left off
 */

import { useCallback, useEffect, useRef } from 'react';

export interface SavedGameState {
  /** User input string (81 chars, 0 = empty) */
  inputString: string;
  /** Pencilmarks string (comma-separated per cell) */
  pencilmarksString: string;
  /** Whether pencil mode was active */
  isPencilMode: boolean;
  /** Last saved timestamp */
  savedAt: string;
}

interface GamePersistenceKey {
  /** Type of puzzle */
  type: 'daily' | 'level';
  /** Unique identifier (date for daily, levelId for level) */
  id: string;
}

const STORAGE_PREFIX = 'sudojo_game_';

function getStorageKey(key: GamePersistenceKey): string {
  return `${STORAGE_PREFIX}${key.type}_${key.id}`;
}

export interface UseGamePersistenceOptions {
  /** Puzzle identifier */
  puzzleKey: GamePersistenceKey | null;
  /** Whether auto-save is enabled */
  autoSave?: boolean;
  /** Debounce delay in ms for auto-save */
  debounceMs?: number;
}

export interface UseGamePersistenceResult {
  /** Load saved game state */
  loadGame: () => SavedGameState | null;
  /** Save current game state */
  saveGame: (state: Omit<SavedGameState, 'savedAt'>) => void;
  /** Clear saved game state */
  clearGame: () => void;
  /** Check if saved game exists */
  hasSavedGame: () => boolean;
}

/**
 * Hook for persisting individual game progress
 *
 * @example
 * ```tsx
 * const { loadGame, saveGame, clearGame } = useGamePersistence({
 *   puzzleKey: { type: 'daily', id: '2024-01-15' },
 *   autoSave: true,
 * });
 *
 * // On mount, try to restore saved state
 * useEffect(() => {
 *   const saved = loadGame();
 *   if (saved) {
 *     // Restore game state
 *   }
 * }, []);
 *
 * // Save after each move
 * useEffect(() => {
 *   saveGame({ inputString, pencilmarksString, isPencilMode });
 * }, [inputString, pencilmarksString, isPencilMode]);
 * ```
 */
export function useGamePersistence({
  puzzleKey,
}: UseGamePersistenceOptions): UseGamePersistenceResult {
  const storageKey = puzzleKey ? getStorageKey(puzzleKey) : null;

  const loadGame = useCallback((): SavedGameState | null => {
    if (!storageKey) return null;

    try {
      const item = window.localStorage.getItem(storageKey);
      if (!item) return null;
      return JSON.parse(item) as SavedGameState;
    } catch (error) {
      console.warn('Error loading saved game:', error);
      return null;
    }
  }, [storageKey]);

  const saveGame = useCallback(
    (state: Omit<SavedGameState, 'savedAt'>) => {
      if (!storageKey) return;

      try {
        const savedState: SavedGameState = {
          ...state,
          savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(storageKey, JSON.stringify(savedState));
      } catch (error) {
        console.warn('Error saving game:', error);
      }
    },
    [storageKey]
  );

  const clearGame = useCallback(() => {
    if (!storageKey) return;

    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Error clearing saved game:', error);
    }
  }, [storageKey]);

  const hasSavedGame = useCallback((): boolean => {
    if (!storageKey) return false;

    try {
      return window.localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [storageKey]);

  return {
    loadGame,
    saveGame,
    clearGame,
    hasSavedGame,
  };
}

/**
 * Hook that auto-saves game state with debouncing
 */
export function useAutoSave(
  puzzleKey: GamePersistenceKey | null,
  getCurrentState: () => Omit<SavedGameState, 'savedAt'> | null,
  dependencies: unknown[],
  debounceMs: number = 1000
): void {
  const { saveGame } = useGamePersistence({ puzzleKey });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!puzzleKey) return;

    // Clear any pending save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      const state = getCurrentState();
      if (state) {
        saveGame(state);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey, saveGame, debounceMs, ...dependencies]);
}
