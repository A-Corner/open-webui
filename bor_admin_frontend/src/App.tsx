import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, Spin, theme as antdTheme } from 'antd'; // Ant Design ConfigProvider
import router from './router'; // Assuming router/index.tsx exports the router instance
import { useAuthStore } from './store/authStore'; // Adjust path
// import { useBrandingStore } from './store/brandingStore'; // If branding store influences AntD theme

// Placeholder for a global loading indicator
const GlobalLoadingIndicator: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="Loading application..." />
  </div>
);

const App: React.FC = () => {
  const { loadUserAction, token } = useAuthStore((state) => ({ // Get token to see if initial load might be needed
    loadUserAction: state.loadUserAction,
    token: state.token,
  }));

  // App-level loading state, primarily for the initial user/auth check
  const [isAppLoading, setIsAppLoading] = useState(true);

  // const { config: brandingConfig } = useBrandingStore(); // If needed for AntD theme

  useEffect(() => {
    const initializeApp = async () => {
      // Try to load user if token might exist (from localStorage via Zustand persist)
      // The store itself is rehydrated by persist middleware before this runs.
      // So, get().token inside loadUserAction() should have the persisted token.
      try {
        await loadUserAction();
      } catch (error) {
        // Error during loadUserAction is handled within the store (sets error state, clears token)
        console.error("App initialization: loadUserAction failed (expected if no token or token invalid).", error);
      } finally {
        setIsAppLoading(false);
      }
    };

    initializeApp();
  }, [loadUserAction]);

  // Ant Design theme customization (example, can be expanded)
  // const antdCustomTheme = {
  //   token: {
  //     colorPrimary: brandingConfig?.ui_theme?.primary_color || '#1677ff', // AntD default blue
  //     fontFamily: brandingConfig?.ui_theme?.font_family || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
  //   },
  //   // algorithm: brandingConfig?.ui_theme?.darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm, // If dark mode is part of branding
  // };


  if (isAppLoading) {
    return <GlobalLoadingIndicator />;
  }

  return (
    <React.StrictMode>
      {/* <ConfigProvider theme={antdCustomTheme}> */}
      <ConfigProvider>
        <RouterProvider router={router} />
      </ConfigProvider>
    </React.StrictMode>
  );
};

export default App;
