export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type Theme = (typeof Theme)[keyof typeof Theme];

export const THEME_STORAGE_KEY = 'sudojo-theme';
