/**
 * Hook to provide configured Sudojo API client
 */

import { useMemo, useState, useEffect } from 'react';
import { getNetworkService } from '@sudobility/di';
import type { NetworkClient, NetworkResponse, NetworkRequestOptions, Optional } from '@sudobility/types';
import type { SudojoConfig, SudojoAuth } from '@sudobility/sudojo_client';
import { auth as firebaseAuth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const config: SudojoConfig = {
  baseUrl: import.meta.env.VITE_SUDOJO_API_URL || 'https://api.sudojo.com',
};

/**
 * Get a fresh Firebase ID token. Returns empty string if not authenticated.
 * Firebase's getIdToken() handles caching - returns cached token if valid,
 * or automatically refreshes if expired.
 */
async function getAuthToken(): Promise<string> {
  const user = firebaseAuth?.currentUser;
  if (!user) return '';

  try {
    return await user.getIdToken();
  } catch (err) {
    console.error('Failed to get ID token:', err);
    return '';
  }
}

/**
 * Adapter to wrap PlatformNetwork to implement NetworkClient interface.
 * On 401 response, refreshes auth token and retries once.
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

  // Execute request, retry once with fresh token on 401
  const executeWithRetry = async <T>(
    url: string,
    requestInit: RequestInit
  ): Promise<NetworkResponse<T>> => {
    const response = await platformNetwork.request(url, requestInit);

    // If 401, get fresh token and retry once
    if (response.status === 401) {
      const freshToken = await getAuthToken();
      if (freshToken) {
        const retryHeaders = {
          ...(requestInit.headers as Record<string, string>),
          Authorization: `Bearer ${freshToken}`,
        };
        const retryResponse = await platformNetwork.request(url, {
          ...requestInit,
          headers: retryHeaders,
        });
        return parseResponse<T>(retryResponse);
      }
    }

    return parseResponse<T>(response);
  };

  return {
    async request<T>(url: string, options?: Optional<NetworkRequestOptions>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: options?.method ?? 'GET',
        headers: options?.headers ?? undefined,
        body: options?.body ?? undefined,
        signal: options?.signal ?? undefined,
      };
      return executeWithRetry<T>(url, requestInit);
    },

    async get<T>(url: string, options?: Optional<Omit<NetworkRequestOptions, 'method' | 'body'>>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: 'GET',
        headers: options?.headers ?? undefined,
        signal: options?.signal ?? undefined,
      };
      return executeWithRetry<T>(url, requestInit);
    },

    async post<T>(url: string, body?: Optional<unknown>, options?: Optional<Omit<NetworkRequestOptions, 'method'>>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: 'POST',
        headers: options?.headers ?? undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: options?.signal ?? undefined,
      };
      return executeWithRetry<T>(url, requestInit);
    },

    async put<T>(url: string, body?: Optional<unknown>, options?: Optional<Omit<NetworkRequestOptions, 'method'>>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: 'PUT',
        headers: options?.headers ?? undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: options?.signal ?? undefined,
      };
      return executeWithRetry<T>(url, requestInit);
    },

    async delete<T>(url: string, options?: Optional<Omit<NetworkRequestOptions, 'method' | 'body'>>): Promise<NetworkResponse<T>> {
      const requestInit: RequestInit = {
        method: 'DELETE',
        headers: options?.headers ?? undefined,
        signal: options?.signal ?? undefined,
      };
      return executeWithRetry<T>(url, requestInit);
    },
  };
}

/**
 * Hook to get the network client, config, and auth for Sudojo API hooks.
 * - networkClient: Retries with fresh token on 401
 * - auth: Updated on auth state changes
 */
export function useSudojoClient() {
  const networkClient = useMemo(() => createNetworkClientAdapter(), []);
  const [auth, setAuth] = useState<SudojoAuth>({ accessToken: '' });

  // Update auth token on auth state changes
  useEffect(() => {
    if (!firebaseAuth) return;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const token = await getAuthToken();
        setAuth({ accessToken: token });
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
