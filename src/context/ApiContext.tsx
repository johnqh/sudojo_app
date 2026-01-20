import { useEffect, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { networkClient } from '@sudobility/di';
import { getInfoService } from '@sudobility/di';
import { InfoType } from '@sudobility/types';
import { useAuthStatus } from '@sudobility/auth-components';
import { getFirebaseAuth } from '@sudobility/auth_lib';
import type { SudojoConfig, SudojoAuth } from '@sudobility/sudojo_client';
import { ApiContext, type ApiContextValue } from './apiContextDef';

const config: SudojoConfig = {
  baseUrl: import.meta.env.VITE_SUDOJO_API_URL || 'https://api.sudojo.com',
};

interface ApiProviderProps {
  children: ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  const { user, loading: authLoading } = useAuthStatus();
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const auth = getFirebaseAuth();

  const baseUrl = config.baseUrl;
  const userId = user?.uid ?? null;

  // Fetch token when user changes
  useEffect(() => {
    let mounted = true;

    const fetchToken = async () => {
      if (!userId) {
        setToken(null);
        setTokenLoading(false);
        return;
      }

      setTokenLoading(true);
      try {
        const currentUser = auth?.currentUser;
        if (!currentUser) {
          setToken(null);
          return;
        }
        const idToken = await currentUser.getIdToken();
        if (mounted) {
          setToken(idToken);
        }
      } catch {
        getInfoService().show(
          'Authentication Error',
          'Failed to get ID token',
          InfoType.ERROR,
          5000
        );
        if (mounted) {
          setToken(null);
        }
      } finally {
        if (mounted) {
          setTokenLoading(false);
        }
      }
    };

    fetchToken();

    return () => {
      mounted = false;
    };
  }, [userId, auth]);

  // Refresh token function for when token expires
  const refreshToken = useCallback(async (): Promise<string | null> => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    try {
      const newToken = await currentUser.getIdToken(true); // Force refresh
      setToken(newToken);
      return newToken;
    } catch {
      getInfoService().show(
        'Authentication Error',
        'Failed to refresh ID token',
        InfoType.ERROR,
        5000
      );
      setToken(null);
      return null;
    }
  }, [auth]);

  // Create SudojoAuth object for library hooks
  const sudojoAuth: SudojoAuth = useMemo(
    () => ({ accessToken: token ?? '' }),
    [token]
  );

  const value = useMemo<ApiContextValue>(
    () => ({
      networkClient,
      config,
      auth: sudojoAuth,
      baseUrl,
      userId,
      token,
      isReady: !!userId && !!token,
      isLoading: authLoading || tokenLoading,
      refreshToken,
    }),
    [sudojoAuth, baseUrl, userId, token, authLoading, tokenLoading, refreshToken]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
