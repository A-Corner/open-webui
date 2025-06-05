import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, Spin, theme as antdTheme } from 'antd';
import { appRouter } from './router'; // Ensure router is exported as appRouter
import { useUserSessionStore } from './store/userSessionStore';
import { useSessionStore } from './store/sessionStore';
import { useUserSettingsStore } from './store/userSettingsStore'; // Import user settings store
import './index.css';

const App: React.FC = () => {
  const loadUserSession = useUserSessionStore((state) => state.loadSessionAction);
  const userIsAuthenticated = useUserSessionStore((state) => state.isAuthenticated);
  const userSessionIsLoading = useUserSessionStore((state) => state.isLoading);

  const fetchAppSessions = useSessionStore(state => state.fetchSessions);
  const sessionsAreLoading = useSessionStore(state => state.isLoading);

  // Theme management from userSettingsStore
  const currentThemeSetting = useUserSettingsStore((state) => state.theme);
  // Default to light theme algorithm initially, will be updated by useEffect
  const [effectiveThemeAlgorithm, setEffectiveThemeAlgorithm] = useState(antdTheme.defaultAlgorithm);

  useEffect(() => {
    const initializeApp = async () => {
      await loadUserSession();
    };
    initializeApp();
  }, [loadUserSession]);

  useEffect(() => {
    if (!userSessionIsLoading && userIsAuthenticated) {
      fetchAppSessions();
    }
  }, [userSessionIsLoading, userIsAuthenticated, fetchAppSessions]);

  // Apply and manage theme based on user settings and system preference
  useEffect(() => {
    const root = window.document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (currentThemeSetting === 'dark' || (currentThemeSetting === 'system' && prefersDark)) {
      setEffectiveThemeAlgorithm(antdTheme.darkAlgorithm);
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      setEffectiveThemeAlgorithm(antdTheme.defaultAlgorithm); // Light theme
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [currentThemeSetting]); // Re-run when user changes theme setting

  // Listen for system theme changes to update if 'system' theme is selected
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if current setting is 'system'
      if (useUserSettingsStore.getState().theme === 'system') {
        const root = window.document.documentElement;
        if (e.matches) {
          setEffectiveThemeAlgorithm(antdTheme.darkAlgorithm);
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          setEffectiveThemeAlgorithm(antdTheme.defaultAlgorithm);
          root.classList.add('light');
          root.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []); // Empty dependency array ensures this runs once to attach/detach listener


  if (userSessionIsLoading || (userIsAuthenticated && sessionsAreLoading)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="应用加载中..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: effectiveThemeAlgorithm,
        // token: { colorPrimary: '#00b96b' } // Example: customize primary color
      }}
    >
      <RouterProvider router={appRouter} />
    </ConfigProvider>
  );
};

export default App;
