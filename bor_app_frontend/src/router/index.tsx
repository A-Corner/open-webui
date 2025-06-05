import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

// Layouts
import MainAppLayout from '../layouts/MainAppLayout'; // Placeholder

// Pages
import LoginPage from '../pages/LoginPage';
import ChatPage from '../pages/ChatPage';
import ProfilePage from '../pages/settings/ProfilePage'; // Updated path
import AppearanceSettingsPage from '../pages/settings/AppearanceSettingsPage'; // New settings page

// Auth
import PrivateRouteApp from '../components/auth/PrivateRouteApp';

const appRouter = createBrowserRouter([ // Renamed router to appRouter for clarity if needed elsewhere
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
      { path: 'chat/:chatId', element: <ChatPage /> },
      { path: 'profile', element: <ProfilePage /> }, // Route for ProfilePage
      { path: 'settings/appearance', element: <AppearanceSettingsPage /> }, // Route for AppearanceSettingsPage
      // Example: if there was a general settings page that links to others:
      // {
      //   path: 'settings',
      //   element: <GeneralSettingsPage />, // A new component
      //   children: [
      //     { index: true, element: <Navigate to="appearance" replace /> },
      //     { path: 'appearance', element: <AppearanceSettingsPage /> },
      //     { path: 'account', element: <AccountSettingsPage /> }, // etc.
      //   ]
      // },
      // Add other main application routes here
    ],
  },
  {
    path: '*', // Catch-all
    element: <Navigate to="/" replace />, // Or a dedicated 404 component for the app
  },
]);

export { appRouter }; // Exporting as appRouter
