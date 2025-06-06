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
  (error: AxiosError<any>) => { // Added type for error.response.data
    const enhancedError = {
      original: error,
      message: '发生未知错误，请稍后再试。', // Default user-friendly message
      status: error.response?.status,
    };

    if (error.response) {
      const { status, data } = error.response;
      let serverMessage = data?.detail || data?.message || ''; // Common places for backend error messages

      if (typeof serverMessage === 'object') { // Sometimes detail can be an object
        serverMessage = JSON.stringify(serverMessage);
      }

      switch (status) {
        case 400:
          enhancedError.message = `请求无效: ${serverMessage || '请检查您的输入。'}`;
          break;
        case 401:
          enhancedError.message = '会话已过期或无效，请重新登录。';
          console.error('App API Error: Unauthorized (401). Token may be invalid or expired.');
          localStorage.removeItem(APP_AUTH_TOKEN_KEY); // Ensure token is cleared
          // Redirect logic should ideally be handled by router observing auth state
          if (!['/login', '/register'].includes(window.location.pathname) && !window.location.pathname.startsWith('/auth')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          enhancedError.message = `权限不足: ${serverMessage || '您没有权限执行此操作。'}`;
          console.error('App API Error: Forbidden (403). User does not have permission.');
          break;
        case 404:
          enhancedError.message = `未找到资源: ${serverMessage || '请求的资源不存在。'}`;
          console.error('App API Error: Not Found (404).');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          enhancedError.message = `服务器错误 (代码: ${status}): ${serverMessage || '服务器暂时无法处理您的请求，请稍后再试或联系管理员。'}`;
          console.error(`App API Error: Server Error (${status}).`);
          break;
        default:
          if (serverMessage) {
            enhancedError.message = `请求失败 (代码: ${status}): ${serverMessage}`;
          } else {
            enhancedError.message = `请求失败，状态码: ${status}。`;
          }
      }
    } else if (error.request) {
      enhancedError.message = '无法连接到服务器，请检查您的网络连接。';
      console.error('App API Error: No response received from server.', error.request);
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      enhancedError.message = '请求超时，请稍后再试。';
      console.error('App API Error: Request Timeout.', error.message);
    }
    else {
      // For other errors (e.g., setup error, network error before request sent)
      enhancedError.message = `请求发起失败: ${error.message || '请检查网络或配置。'}`;
      console.error('App API Error: Error setting up request.', error.message);
    }
    // Instead of rejecting with the original error, reject with the enhanced error object
    // This allows services to directly use the user-friendly message.
    // However, to maintain compatibility with existing `error.response.data.detail` access in services,
    // we might need a more nuanced approach or update all services.
    // For now, let's attach our friendly message to the original error object.
    (error as any).friendlyMessage = enhancedError.message;
    return Promise.reject(error); // Still reject with original error, but augmented
  }
);

export default appAxiosInstance;
