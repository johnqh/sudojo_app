import { createContext, useContext } from 'react';
import type { NetworkClient } from '@sudobility/types';
import type { SudojoConfig, SudojoAuth } from '@sudobility/sudojo_client';

export interface ApiContextValue {
  networkClient: NetworkClient;
  config: SudojoConfig;
  auth: SudojoAuth;
  baseUrl: string;
  userId: string | null;
  token: string | null;
  isReady: boolean;
  isLoading: boolean;
  refreshToken: () => Promise<string | null>;
}

export const ApiContext = createContext<ApiContextValue | null>(null);

export function useApi(): ApiContextValue {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
