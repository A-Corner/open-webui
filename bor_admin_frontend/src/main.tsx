import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css'; // Ant Design v5+ reset/base styles
import './index.css'; // Project's global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
  // StrictMode is already in App.tsx, so no need to wrap App here again.
  // If App.tsx didn't have StrictMode, it would be:
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>
);
