import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Map Firebase error codes to user-friendly keys
const getErrorMessage = (code: string): string => {
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-email': 'Invalid email address',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign in cancelled',
  };
  return errorMap[code] || 'Something went wrong. Please try again.';
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    if (!auth || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async currentUser => {
        if (currentUser) {
          setUser(currentUser);
          setLoading(false);
          // Close modal on successful non-anonymous auth
          if (!currentUser.isAnonymous) {
            setIsAuthModalOpen(false);
          }
        } else {
          // No user logged in - sign in anonymously
          try {
            await signInAnonymously(auth);
            // The auth state will change again with the anonymous user
          } catch (err) {
            console.error('Anonymous sign in error:', err);
            setLoading(false);
          }
        }
      },
      err => {
        console.error('Auth state change error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      setError('Firebase not configured');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };
      setError(getErrorMessage(firebaseError.code || ''));
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in with email/password
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!auth) {
        setError('Firebase not configured');
        return;
      }

      setError(null);
      setLoading(true);

      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        const firebaseError = err as { code?: string; message?: string };
        setError(getErrorMessage(firebaseError.code || ''));
        console.error('Email sign in error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sign up with email/password
  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!auth) {
        setError('Firebase not configured');
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const { user: newUser } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (displayName && newUser) {
          await updateProfile(newUser, { displayName });
        }
      } catch (err) {
        const firebaseError = err as { code?: string; message?: string };
        setError(getErrorMessage(firebaseError.code || ''));
        console.error('Email sign up error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    if (!auth) {
      setError('Firebase not configured');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };
      setError(getErrorMessage(firebaseError.code || ''));
      console.error('Password reset error:', err);
      throw err; // Re-throw so caller knows it failed
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (!auth) {
      return;
    }

    setError(null);

    try {
      await firebaseSignOut(auth);
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };
      setError(getErrorMessage(firebaseError.code || ''));
      console.error('Sign out error:', err);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Modal controls
  const openAuthModal = useCallback(() => {
    setError(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setError(null);
    setIsAuthModalOpen(false);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    clearError,
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous ?? false,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
