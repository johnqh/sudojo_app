import type { ReactNode } from 'react';
import {
  ThemeProvider as SharedThemeProvider,
  useTheme as useSharedTheme,
  Theme,
} from '@sudobility/components';

// Re-export Theme for consumers
export { Theme } from '@sudobility/components';

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = useSharedTheme;

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <SharedThemeProvider
      themeStorageKey="sudojo-theme"
      defaultTheme={Theme.LIGHT}
    >
      {children}
    </SharedThemeProvider>
  );
}
