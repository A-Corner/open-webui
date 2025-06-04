import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage'; // Placeholder
import AdminLayout from '../layouts/AdminLayout'; // Placeholder
import DashboardPage from '../pages/dashboard/DashboardPage'; // Placeholder for a page after login
import UserListPage from '../pages/users/UserListPage'; // Placeholder for user list
import SystemSettingsPage from '../pages/settings/SystemSettingsPage'; // Placeholder
import PrivateRoute from '../components/auth/PrivateRoute'; // Import PrivateRoute

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AdminLayout />
      </PrivateRoute>
    ),
    children: [
      // Default route after login, e.g., Dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'users', element: <UserListPage /> },
      {
        path: 'settings',
        // element: <Outlet />, // If settings has sub-routes
        children: [
            { index: true, element: <Navigate to="system" replace /> }, // Default settings page
            { path: 'system', element: <SystemSettingsPage /> },
            // Add more setting sub-pages here, e.g. branding, knowledge_base_settings etc.
        ]
      },
      // Add other admin routes here
      // Example: /knowledge, /models etc.
    ],
  },
  {
    // Catch-all for 404 or redirect to a specific page
    path: '*',
    element: <Navigate to="/" replace />, // Or a dedicated 404 component
  },
]);

export default router;
