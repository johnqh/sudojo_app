/**
 * Hook to provide configured Sudojo API client
 */

import { useMemo, useState, useEffect } from 'react';
import { getNetworkService } from '@sudobility/di';
import type { NetworkClient, NetworkResponse, NetworkRequestOptions, Optional } from '@sudobility/types';
import type { SudojoConfig, SudojoAuth } from '@sudobility/sudojo_client';
import { useAuthStatus } from '@sudobility/auth-components';
import { auth as firebaseAuth } from '@/config/firebase';

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
  const { user } = useAuthStatus();
  const [auth, setAuth] = useState<SudojoAuth>({ accessToken: '' });

  // Get Firebase ID token when user changes
  useEffect(() => {
    let isMounted = true;

    const fetchToken = async () => {
      // Use Firebase auth directly to get the current user's ID token
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          if (isMounted) {
            setAuth({ accessToken: token });
          }
        } catch (err) {
          console.error('Failed to get ID token:', err);
          if (isMounted) {
            setAuth({ accessToken: '' });
          }
        }
      } else {
        if (isMounted) {
          setAuth({ accessToken: '' });
        }
      }
    };

    fetchToken();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return {
    networkClient,
    config,
    auth,
  };
}
