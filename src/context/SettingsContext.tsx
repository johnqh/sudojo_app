/**
 * Settings Context - Global app settings with persistence
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface AppSettings {
  /** Show errors when input doesn't match solution */
  showErrors: boolean;
  /** Generate symmetrical puzzles */
  symmetrical: boolean;
  /** Digit display format */
  display: 'numeric' | 'kanji' | 'emojis';
}

const DEFAULT_SETTINGS: AppSettings = {
  showErrors: true,
  symmetrical: true,
  display: 'numeric',
};

const SETTINGS_KEY = 'sudojo-settings';

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useLocalStorage<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, [setSettings]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, [setSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  const value: SettingsContextType = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
