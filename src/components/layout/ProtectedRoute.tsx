import type { ReactNode } from 'react';
import { ProtectedRoute as SharedProtectedRoute } from '@sudobility/components';
import { useAuthStatus } from '@sudobility/auth-components';

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthStatus();

  return (
    <SharedProtectedRoute
      isAuthenticated={!!user}
      isLoading={loading}
      redirectPath="/:lang"
      loadingComponent={
        <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      {children}
    </SharedProtectedRoute>
  );
}

export default ProtectedRoute;
