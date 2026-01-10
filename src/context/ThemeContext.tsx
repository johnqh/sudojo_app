import type { ReactNode } from 'react';
import {
  ThemeProvider as SharedThemeProvider,
  useTheme as useSharedTheme,
  Theme,
  FontSize,
} from '@sudobility/components';

// Re-export Theme and FontSize for consumers
export { Theme, FontSize } from '@sudobility/components';

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = useSharedTheme;

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <SharedThemeProvider
      themeStorageKey="sudojo-theme"
      fontSizeStorageKey="sudojo-font-size"
      defaultTheme={Theme.LIGHT}
      defaultFontSize={FontSize.MEDIUM}
    >
      {children}
    </SharedThemeProvider>
  );
}
