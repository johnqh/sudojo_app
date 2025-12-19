import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { getStorageService } from '@sudobility/di';
import { Theme, THEME_STORAGE_KEY } from '@/config/theme';
import { ThemeContext } from './themeContextDef';
import {
  getSystemTheme,
  resolveTheme,
  isValidThemePreference,
  type ResolvedTheme,
} from '@sudobility/sudojo_lib';

function getInitialTheme(): Theme {
  try {
    const storage = getStorageService();
    const saved = storage.getItem(THEME_STORAGE_KEY);
    if (saved && isValidThemePreference(saved)) {
      return saved as Theme;
    }
  } catch {
    // Storage not available
  }
  return Theme.LIGHT;
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Compute resolved theme from theme preference and system theme
  const resolvedTheme = useMemo((): ResolvedTheme => {
    return resolveTheme(theme, systemTheme);
  }, [theme, systemTheme]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setSystemTheme(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      const storage = getStorageService();
      storage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Storage not available
    }
  };

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
