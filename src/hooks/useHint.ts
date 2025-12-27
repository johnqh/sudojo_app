/**
 * Re-export hint hook from sudojo_lib with app-specific wrapper
 */

import { useHint as useHintBase } from '@sudobility/sudojo_lib';
import type { UseHintResult, HintBoardData } from '@sudobility/sudojo_lib';
import { useSolverClient } from './useSolverClient';

// Re-export types from lib
export type { UseHintResult, HintBoardData };

/** Options for useHint (app-specific - uses useSolverClient internally) */
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

/**
 * App-specific wrapper for useHint that uses useSolverClient
 * to provide network client and config automatically.
 */
export function useHint({
  puzzle,
  userInput,
  pencilmarks,
  autoPencilmarks = false,
}: UseHintOptions): UseHintResult {
  const { networkClient, config, auth } = useSolverClient();

  return useHintBase({
    networkClient,
    config,
    auth,
    puzzle,
    userInput,
    pencilmarks,
    autoPencilmarks,
  });
}
