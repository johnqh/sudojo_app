/**
 * Hook for getting hints from the Sudoku solver
 *
 * Matches Kotlin HintInteractor behavior:
 * - Stores all hint steps from the API response
 * - Tracks current step index
 * - next() advances to next step (if available)
 * - previous() goes back to previous step
 * - getHint() fetches new hints OR advances to next step if hints exist
 */

import { useState, useCallback, useRef } from 'react';
import { createSudojoSolverClient } from '@sudobility/sudojo_solver_client';
import type { HintStep, HintsPayload, SolveResponse } from '@sudobility/sudojo_solver_client';
import { useSolverClient } from './useSolverClient';

export interface UseHintOptions {
  /** Original puzzle string (81 chars) */
  puzzle: string;
  /** Current user input string (81 chars) */
  userInput: string;
  /** Current pencilmarks (comma-separated or empty) */
  pencilmarks?: string;
  /** Whether auto-pencilmarks were generated */
  autoPencilmarks?: boolean;
}

export interface UseHintResult {
  /** Current hint step being displayed */
  hint: HintStep | null;
  /** All hint steps (for showing progress like "Step 1 of 3") */
  hints: HintsPayload | null;
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether a hint request is in progress */
  isLoading: boolean;
  /** Error message if hint request failed */
  error: string | null;
  /** Request hints or advance to next step */
  getHint: () => Promise<void>;
  /** Go to next hint step */
  nextStep: () => void;
  /** Go to previous hint step */
  previousStep: () => void;
  /** Clear all hints */
  clearHint: () => void;
  /** Whether there are more steps after current */
  hasNextStep: boolean;
  /** Whether there are steps before current */
  hasPreviousStep: boolean;
}

/**
 * Hook for getting hints from the solver API
 *
 * Matches Kotlin HintInteractor behavior:
 * - First call to getHint() fetches hints from API
 * - Subsequent calls advance to next step (if available)
 * - Use nextStep()/previousStep() to navigate manually
 * - clearHint() resets everything
 *
 * @param options - Puzzle state for hint generation
 * @returns Hint state and controls
 */
export function useHint({
  puzzle,
  userInput,
  pencilmarks,
  autoPencilmarks = false,
}: UseHintOptions): UseHintResult {
  const { networkClient, config } = useSolverClient();
  const [hints, setHints] = useState<HintsPayload | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track puzzle state to detect when we need to re-fetch
  const lastPuzzleStateRef = useRef<string>('');

  // Compute current hint step
  const hint = hints?.steps?.[stepIndex] ?? null;
  const totalSteps = hints?.steps?.length ?? 0;
  const hasNextStep = stepIndex < totalSteps - 1;
  const hasPreviousStep = stepIndex > 0;

  // Fetch hints from API
  const fetchHints = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const client = createSudojoSolverClient(networkClient, config);
      const response: SolveResponse = await client.solve({
        original: puzzle,
        user: userInput,
        autoPencilmarks,
        pencilmarks,
      });

      if (response.success && response.data?.hints?.steps?.length) {
        setHints(response.data.hints);
        setStepIndex(0);
        // Track the puzzle state we fetched for
        lastPuzzleStateRef.current = `${puzzle}|${userInput}|${pencilmarks ?? ''}`;
      } else if (response.error) {
        setError(response.error.message);
        setHints(null);
      } else {
        setError('No hints available');
        setHints(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get hint');
      setHints(null);
    } finally {
      setIsLoading(false);
    }
  }, [networkClient, config, puzzle, userInput, pencilmarks, autoPencilmarks]);

  // Get hint: fetch if no hints or puzzle changed, otherwise advance
  const getHint = useCallback(async () => {
    const currentPuzzleState = `${puzzle}|${userInput}|${pencilmarks ?? ''}`;

    if (hints === null || lastPuzzleStateRef.current !== currentPuzzleState) {
      // No hints or puzzle state changed - fetch new hints
      await fetchHints();
    } else if (hasNextStep) {
      // Have hints and more steps - advance to next
      setStepIndex((prev) => prev + 1);
    }
    // If at last step and hints exist, do nothing (stay on last step)
  }, [hints, hasNextStep, fetchHints, puzzle, userInput, pencilmarks]);

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (hasNextStep) {
      setStepIndex((prev) => prev + 1);
    }
  }, [hasNextStep]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    if (hasPreviousStep) {
      setStepIndex((prev) => prev - 1);
    }
  }, [hasPreviousStep]);

  // Clear all hints
  const clearHint = useCallback(() => {
    setHints(null);
    setStepIndex(0);
    setError(null);
    lastPuzzleStateRef.current = '';
  }, []);

  return {
    hint,
    hints,
    stepIndex,
    totalSteps,
    isLoading,
    error,
    getHint,
    nextStep,
    previousStep,
    clearHint,
    hasNextStep,
    hasPreviousStep,
  };
}
