import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore'; // Adjust path as needed

interface PrivateRouteProps {
  children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, token } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading, // isLoading from the store during token validation
    token: state.token,
  }));
  const location = useLocation();

  // This isLoading reflects the store's general loading state,
  // but for initial app load, loadUserAction's completion is key.
  // A common pattern is to have a separate "app loading" or "auth check pending" state
  // that is true until loadUserAction completes.

  // If there's a token but user isn't authenticated yet, and it's still loading,
  // it means loadUserAction might be in progress.
  // Showing a loader here might be better than redirecting immediately.
  // However, if isLoading is specifically for login/logout actions, not initial load,
  // then checking isAuthenticated is primary.

  // For initial load, App.tsx should ideally show a global loader until loadUserAction is done.
  // After that, this PrivateRoute can rely purely on isAuthenticated.
  // Let's assume initial loading is handled at App level.

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children || <Outlet />}</>;
};

export default PrivateRoute;
