import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

// Layouts
import MainAppLayout from '../layouts/MainAppLayout'; // Placeholder

// Pages
import LoginPage from '../pages/LoginPage'; // Placeholder for app's LoginPage
import ChatPage from '../pages/ChatPage';   // Placeholder for main chat page
import ProfilePage from '../pages/ProfilePage'; // Placeholder
import UserSettingsPage from '../pages/UserSettingsPage'; // Placeholder for user's own settings

// Auth
import PrivateRouteApp from '../components/auth/PrivateRouteApp'; // App-specific PrivateRoute

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />, // App's own login page if different from admin
  },
  // Add /register if app allows self-registration separately
  // {
  //   path: '/register',
  //   element: <RegisterPage />,
  // },
  {
    path: '/',
    element: (
      <PrivateRouteApp>
        <MainAppLayout />
      </PrivateRouteApp>
    ),
    children: [
      { index: true, element: <Navigate to="/chat" replace /> }, // Default to chat page
      { path: 'chat', element: <ChatPage /> },
      { path: 'chat/:chatId', element: <ChatPage /> }, // Chat with specific ID
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <UserSettingsPage /> }, // User's own settings
      // Add other main application routes here
    ],
  },
  {
    path: '*', // Catch-all
    element: <Navigate to="/" replace />, // Or a dedicated 404 component for the app
  },
]);

export default router;
