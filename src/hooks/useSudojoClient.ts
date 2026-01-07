/**
 * Hook to provide configured Sudojo API client
 */

import { useState, useEffect } from 'react';
import type { SudojoConfig, SudojoAuth } from '@sudobility/sudojo_client';
import { getFirebaseAuth, useFirebaseAuthNetworkClient } from '@sudobility/auth_lib';
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
  const firebaseAuth = getFirebaseAuth();
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
 * Hook to get the network client, config, and auth for Sudojo API hooks.
 * - networkClient: Uses auth_lib's useFirebaseAuthNetworkClient with automatic 401 retry and 403 logout
 * - auth: Updated on auth state changes
 */
export function useSudojoClient() {
  // Use auth_lib's network client with automatic token refresh on 401 and logout on 403
  const networkClient = useFirebaseAuthNetworkClient();
  const [auth, setAuth] = useState<SudojoAuth>({ accessToken: '' });

  // Update auth token on auth state changes
  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
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
