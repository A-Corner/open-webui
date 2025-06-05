import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserSessionStore } from '../../store/userSessionStore'; // Adjust path

interface PrivateRouteAppProps {
  children?: React.ReactNode;
}

const PrivateRouteApp: React.FC<PrivateRouteAppProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useUserSessionStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading, // To handle initial session load
  }));
  const location = useLocation();

  // If initial session load is happening (isLoading) and we don't know auth status yet,
  // it's often better to show a global loading spinner at App.tsx level.
  // If PrivateRouteApp is reached while isLoading is true, it means App.tsx decided not to show global spinner,
  // or this is a route change where auth status is being re-validated.
  // For simplicity, if not authenticated (after initial check), redirect to login.
  // A more robust solution might involve checking if a token exists while isLoading,
  // and showing a spinner here instead of redirecting if token exists but user isn't fetched yet.

  if (!isAuthenticated && !isLoading) { // Only redirect if not loading and not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If still loading but not yet authenticated, you might show a route-level loader here,
  // but usually App.tsx handles the initial app-wide loading screen.
  // if (isLoading) {
  //   return <div>Loading session...</div>; // Or a spinner component
  // }

  return <>{children || <Outlet />}</>;
};

export default PrivateRouteApp;
