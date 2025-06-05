import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css'; // Ant Design v5+ reset/base styles
import './index.css';       // Project's global styles
// Potentially import a global styles for AntD theme variables if not using ConfigProvider directly
// import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode is already in App.tsx
  <App />
);
