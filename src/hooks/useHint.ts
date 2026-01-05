/**
 * Re-export hint hook from sudojo_lib with app-specific wrapper
 */

import { useHint as useHintBase } from '@sudobility/sudojo_lib';
import type { UseHintResult, HintBoardData, HintReceivedData } from '@sudobility/sudojo_lib';
import { useSudojoClient } from './useSudojoClient';

// Re-export types from lib
export type { UseHintResult, HintBoardData, HintReceivedData };

/** Options for useHint (app-specific - uses useSudojoClient internally) */
export interface UseHintOptions {
  /** Original puzzle string (81 chars) */
  puzzle: string;
  /** Current user input string (81 chars) */
  userInput: string;
  /** Current pencilmarks (comma-separated or empty) */
  pencilmarks?: string;
  /** Whether auto-pencilmarks were generated */
  autoPencilmarks?: boolean;
  /**
   * Callback fired when hints are received from the API.
   * Use this to intercept hints for logging, saving examples, etc.
   */
  onHintReceived?: (data: HintReceivedData) => void;
}

/**
 * App-specific wrapper for useHint that uses useSudojoClient
 * to provide network client and config automatically.
 */
export function useHint({
  puzzle,
  userInput,
  pencilmarks,
  autoPencilmarks = false,
  onHintReceived,
}: UseHintOptions): UseHintResult {
  const { networkClient, config, auth } = useSudojoClient();

  return useHintBase({
    networkClient,
    config,
    auth,
    puzzle,
    userInput,
    pencilmarks,
    autoPencilmarks,
    onHintReceived,
  });
}
