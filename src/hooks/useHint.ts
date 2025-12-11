/**
 * Hook for getting hints from the Sudoku solver
 */

import { useState, useCallback } from 'react';
import { createSudojoSolverClient } from '@sudobility/sudojo_solver_client';
import type { HintStep, SolveResponse } from '@sudobility/sudojo_solver_client';
import { useSolverClient } from './useSolverClient';

export interface UseHintOptions {
  /** Original puzzle string (81 chars) */
  puzzle: string;
  /** Current user input string (81 chars) */
  userInput: string;
  /** Current pencilmarks (comma-separated or empty) */
  pencilmarks?: string;
}

export interface UseHintResult {
  /** Current hint being displayed */
  hint: HintStep | null;
  /** Whether a hint request is in progress */
  isLoading: boolean;
  /** Error message if hint request failed */
  error: string | null;
  /** Request a new hint */
  getHint: () => Promise<void>;
  /** Clear the current hint */
  clearHint: () => void;
}

/**
 * Hook for getting hints from the solver API on demand
 *
 * @param options - Puzzle state for hint generation
 * @returns Hint state and controls
 *
 * @example
 * ```tsx
 * const { hint, isLoading, error, getHint, clearHint } = useHint({
 *   puzzle: originalPuzzle,
 *   userInput: currentBoard,
 * });
 *
 * <button onClick={getHint} disabled={isLoading}>
 *   {isLoading ? 'Loading...' : 'Get Hint'}
 * </button>
 * {hint && <HintPanel hint={hint} onDismiss={clearHint} />}
 * ```
 */
export function useHint({ puzzle, userInput, pencilmarks }: UseHintOptions): UseHintResult {
  const { networkClient, config } = useSolverClient();
  const [hint, setHint] = useState<HintStep | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHint = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const client = createSudojoSolverClient(networkClient, config);
      const response: SolveResponse = await client.solve({
        original: puzzle,
        user: userInput,
        autoPencilmarks: !pencilmarks, // Use auto if no manual pencilmarks
        pencilmarks,
      });

      if (response.success && response.data?.hints?.steps?.length) {
        // Get the first hint step
        setHint(response.data.hints.steps[0]);
      } else if (response.error) {
        setError(response.error.message);
      } else {
        setError('No hints available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get hint');
    } finally {
      setIsLoading(false);
    }
  }, [networkClient, config, puzzle, userInput, pencilmarks]);

  const clearHint = useCallback(() => {
    setHint(null);
    setError(null);
  }, []);

  return {
    hint,
    isLoading,
    error,
    getHint,
    clearHint,
  };
}
