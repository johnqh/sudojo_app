/**
 * Theme configuration - re-exports from sudojo_lib
 */

import {
  type ThemePreference,
  type ResolvedTheme,
  THEME_STORAGE_KEY,
} from '@sudobility/sudojo_lib';

// Backward compatibility: Theme is an alias for ThemePreference
export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type Theme = ThemePreference;

// Re-export from lib
export { THEME_STORAGE_KEY };
export type { ThemePreference, ResolvedTheme };
