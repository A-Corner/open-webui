import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config'; // Use config from the new file

// Placeholder for auth store for the app frontend
// import { useUserSessionStore } from '../store/userSessionStore';

export const APP_AUTH_TOKEN_KEY = 'app_auth_token'; // Different key from admin

const appAxiosInstance = axios.create({
  baseURL: API_BASE_URL, // This should point to /api/v1 or similar
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Authorization token to headers
appAxiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // const token = useUserSessionStore.getState().token;
    const token = localStorage.getItem(APP_AUTH_TOKEN_KEY);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle common API errors
appAxiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        console.error('App API Error: Unauthorized (401). Token may be invalid or expired.');
        // Placeholder: Trigger logout action from userSessionStore
        // useUserSessionStore.getState().logoutAction(false);
        localStorage.removeItem(APP_AUTH_TOKEN_KEY);

        // Redirect to app's login page.
        // Avoid hardcoding if router can handle this based on store state.
        if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/auth')) { // Avoid loops if login is under /auth
          // Check if current path is already a public path to avoid redirect loops
          const publicPaths = ['/login', '/register']; // Define your app's public paths
          if (!publicPaths.includes(window.location.pathname)) {
            window.location.href = '/login';
          }
        }
      } else if (status === 403) {
        console.error('App API Error: Forbidden (403). User does not have permission.');
      } else if (status === 500) {
        console.error('App API Error: Internal Server Error (500).');
      }
    } else if (error.request) {
      console.error('App API Error: No response received from server.', error.request);
    } else {
      console.error('App API Error: Error setting up request.', error.message);
    }
    return Promise.reject(error);
  }
);

export default appAxiosInstance;
