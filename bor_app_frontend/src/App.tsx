import React, { useEffect, useState, Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, Spin, theme as antdTheme } from 'antd'; // Ant Design ConfigProvider
import router from './router';
import { useUserSessionStore } from './store/userSessionStore';
// import { useBrandingStore } from './store/brandingStore'; // For app branding if needed for AntD theme

// Global Loading Indicator for app initialization/session loading
const AppLoadingIndicator: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
    {/* Placeholder for App Logo using branding store */}
    {/* <img src={useBrandingStore.getState().config?.logo_path || '/static/logo.png'} alt="Loading Logo" style={{height: '80px', marginBottom: '20px'}} /> */}
    <Spin size="large" tip="Loading Application..." />
  </div>
);

const App: React.FC = () => {
  const { loadSessionAction, token } = useUserSessionStore((state) => ({
    loadSessionAction: state.loadSessionAction,
    token: state.token, // Access token to see if an initial load attempt is relevant
  }));

  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // const { config: brandingConfig, fetchConfig: fetchBrandingConfig } = useBrandingStore();

  useEffect(() => {
    const initializeAppSession = async () => {
      // Fetch branding config first if it influences anything critical early on
      // await fetchBrandingConfig(); // Assuming brandingStore also has fetchConfig

      // Then try to load user session
      try {
        await loadSessionAction();
      } catch (error) {
        console.error("App initialization: loadSessionAction failed.", error);
        // Error handled in store, typically results in isAuthenticated: false
      } finally {
        setIsSessionLoading(false);
      }
    };

    initializeAppSession();
  }, [loadSessionAction /*, fetchBrandingConfig */]); // Add other init actions if needed

  // Example: Ant Design theme customization based on branding config
  // const { token: antdInternalToken } = antdTheme.useToken(); // If using inside ConfigProvider for dynamic changes
  // const appAntdTheme = React.useMemo(() => {
  //   const primaryColor = brandingConfig?.ui_theme?.primary_color;
  //   const fontFamily = brandingConfig?.ui_theme?.font_family;
  //   const newTheme = { ...antdInternalToken }; // Start with current theme tokens
  //   if (primaryColor) newTheme.colorPrimary = primaryColor;
  //   if (fontFamily) newTheme.fontFamily = fontFamily;

  //   return { token: newTheme };
  // }, [brandingConfig, antdInternalToken]);


  if (isSessionLoading) {
    return <AppLoadingIndicator />;
  }

  return (
    <React.StrictMode>
      {/* <ConfigProvider theme={appAntdTheme}> */}
      <ConfigProvider> {/* Using default AntD theme for now */}
        <Suspense fallback={<AppLoadingIndicator />}> {/* For route-based code splitting */}
          <RouterProvider router={router} />
        </Suspense>
      </ConfigProvider>
    </React.StrictMode>
  );
};

export default App;
