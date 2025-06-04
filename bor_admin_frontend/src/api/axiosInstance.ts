import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config'; // Use config from the new file

// Placeholder for auth store - replace with actual Zustand store import later
// import { useAuthStore } from '../store/authStore';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Authorization token to headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Placeholder: Get token from Zustand store or localStorage
    // const token = useAuthStore.getState().token;
    const token = localStorage.getItem('admin_auth_token'); // Simple localStorage example for now

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
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error: AxiosError) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response) {
      const { status, data } = error.response;
      // const { detail } = data as { detail?: string }; // Assuming error responses have a 'detail' field

      if (status === 401) {
        // Unauthorized: Token might be invalid or expired
        console.error('API Error: Unauthorized (401). Token may be invalid or expired.');
        // Placeholder: Trigger logout action from Zustand store
        // useAuthStore.getState().logoutAction(false); // false indicates not a user-initiated logout
        // For now, redirect to login, clear token
        localStorage.removeItem('admin_auth_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'; // Consider using React Router's navigate for SPA behavior
        }
      } else if (status === 403) {
        console.error('API Error: Forbidden (403). User does not have permission.');
        // Optionally, show a global notification
      } else if (status === 500) {
        console.error('API Error: Internal Server Error (500).');
        // Optionally, show a global notification
      }

      // You might want to throw a more structured error or the original error
      // so that individual API call sites can also handle it if needed.
      // For now, we log it and the original error is rejected.
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received from server.', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error: Error setting up request.', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
