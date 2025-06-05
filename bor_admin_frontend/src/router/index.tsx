import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage'; // Placeholder
import AdminLayout from '../layouts/AdminLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import UserListPage from '../pages/users/UserListPage';
import SystemSettingsPage from '../pages/settings/SystemSettingsPage';
import PrivateRoute from '../components/auth/PrivateRoute';
import ExternalRagPage from '../pages/rag/ExternalRagPage';
import ModelManagementPage from '../pages/models/ModelManagementPage';
import KnowledgeBasePage from '../pages/knowledge/KnowledgeBasePage'; // Import the new knowledge base page
// Placeholder for other pages if needed by new menu items


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
            { index: true, element: <Navigate to="system-configs" replace /> }, // Default settings page
            { path: 'system-configs', element: <SystemSettingsPage /> },
            // Placeholder for other settings pages if they become distinct routes
            // { path: 'branding', element: <BrandingSettingsPage /> },
            // { path: 'external-rag-admin', element: <ExternalRagAdminPage /> },
        ]
      },
      // Placeholder routes for other admin sections if top-level menu items are added
      // { path: 'knowledge', element: <KnowledgePage /> },
      {
        path: 'models',
        children: [
            { index: true, element: <Navigate to="management" replace /> },
            { path: 'management', element: <ModelManagementPage /> },
        ]
      },
      {
        path: 'knowledge', // New top-level route for knowledge base management
        children: [
          { index: true, element: <Navigate to="management" replace /> },
          { path: 'management', element: <KnowledgeBasePage /> }
        ]
      },
      {
        path: 'rag', // Existing RAG section, if external RAG is different from general knowledge
        children: [
          { index: true, element: <Navigate to="external-services" replace /> },
          { path: 'external-services', element: <ExternalRagPage /> },
          // Other RAG related admin pages can go here
        ]
      }
    ],
  },
  {
    // Catch-all for 404 or redirect to a specific page
    path: '*',
    element: <Navigate to="/" replace />, // Or a dedicated 404 component
  },
]);

export default router;
