/**
 * Hook to provide configured Sudojo API client
 */

import { useMemo, useState, useEffect } from 'react';
import { getNetworkService } from '@sudobility/di';
import type { NetworkClient, NetworkResponse, NetworkRequestOptions, Optional } from '@sudobility/types';
import type { SudojoConfig, SudojoAuth } from '@sudobility/sudojo_client';
import { auth as firebaseAuth } from '@/config/firebase';
import { onIdTokenChanged } from 'firebase/auth';

const config: SudojoConfig = {
  baseUrl: import.meta.env.VITE_SUDOJO_API_URL || 'https://api.sudojo.com',
};

/**
 * Adapter to wrap PlatformNetwork to implement NetworkClient interface
 */
function createNetworkClientAdapter(): NetworkClient {
  const platformNetwork = getNetworkService();

  const parseResponse = async <T>(response: Response): Promise<NetworkResponse<T>> => {
    let data: T | undefined;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        data = (await response.json()) as T;
      } catch {
        // JSON parse failed, leave data undefined
      }
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers,
      data,
      success: response.ok,
      timestamp: new Date().toISOString(),
    };
  };

  return {
    async request<T>(url: string, options?: Optional<NetworkRequestOptions>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: options?.method ?? 'GET',
        headers: options?.headers ?? undefined,
        body: options?.body ?? undefined,
        signal: options?.signal ?? undefined,
      };
      const response = await platformNetwork.request(url, requestInit);
      return parseResponse<T>(response);
    },

    async get<T>(url: string, options?: Optional<Omit<NetworkRequestOptions, 'method' | 'body'>>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: 'GET',
        headers: options?.headers ?? undefined,
        signal: options?.signal ?? undefined,
      };
      const response = await platformNetwork.request(url, requestInit);
      return parseResponse<T>(response);
    },

    async post<T>(url: string, body?: Optional<unknown>, options?: Optional<Omit<NetworkRequestOptions, 'method'>>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: 'POST',
        headers: options?.headers ?? undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: options?.signal ?? undefined,
      };
      const response = await platformNetwork.request(url, requestInit);
      return parseResponse<T>(response);
    },

    async put<T>(url: string, body?: Optional<unknown>, options?: Optional<Omit<NetworkRequestOptions, 'method'>>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: 'PUT',
        headers: options?.headers ?? undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: options?.signal ?? undefined,
      };
      const response = await platformNetwork.request(url, requestInit);
      return parseResponse<T>(response);
    },

    async delete<T>(url: string, options?: Optional<Omit<NetworkRequestOptions, 'method' | 'body'>>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: 'DELETE',
        headers: options?.headers ?? undefined,
        signal: options?.signal ?? undefined,
      };
      const response = await platformNetwork.request(url, requestInit);
      return parseResponse<T>(response);
    },
  };
}

/**
 * Hook to get the network client, config, and auth for Sudojo API hooks
 */
export function useSudojoClient() {
  const networkClient = useMemo(() => createNetworkClientAdapter(), []);
  const [auth, setAuth] = useState<SudojoAuth>({ accessToken: '' });

  // Listen for Firebase ID token changes (including automatic hourly refresh)
  useEffect(() => {
    // If Firebase auth is not configured, keep the initial empty token state
    if (!firebaseAuth) {
      return;
    }

    // onIdTokenChanged fires when:
    // - User signs in
    // - User signs out
    // - Token is refreshed (every hour)
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuth({ accessToken: token });
        } catch (err) {
          console.error('Failed to get ID token:', err);
          setAuth({ accessToken: '' });
        }
      } else {
        setAuth({ accessToken: '' });
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    networkClient,
    config,
    auth,
  };
}
