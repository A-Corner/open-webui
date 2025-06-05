import appAxiosInstance, { APP_AUTH_TOKEN_KEY } from './axiosInstance'; // Using app specific axios instance

// Interfaces (can be shared or app-specific if user view differs from admin view)
// For now, assuming similar structure to admin's authService User/LoginResponse
// If User type is different for app vs admin, define it here or in a shared types file.
export interface User {
  id: string;
  name: string; // Or username, ensure consistency with backend response from /users/me
  username?: string; // If 'name' is preferred for display and 'username' for login
  email: string;
  role: string;
  profile_image_url?: string;
  is_active?: boolean; // Might not be exposed to regular users directly
  // App-specific user fields if any
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User; // Backend user object
}

const AUTH_API_BASE_URL_V1 = '/api/v1/auths';
const USERS_API_BASE_URL_V1 = '/api/v1/users';


export const login = async (credentials: {
  username_or_email: string;
  password: string;
}): Promise<LoginResponse> => {
  const params = new URLSearchParams();
  // Backend /login/db expects 'username' for username_or_email
  params.append('username', credentials.username_or_email);
  params.append('password', credentials.password);

  const response = await appAxiosInstance.post(`${AUTH_API_BASE_URL_V1}/login/db`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  // Store token for axiosInstance interceptor to pick up immediately for subsequent calls if needed.
  // However, Zustand persist will handle this too.
  // For safety, if not using Zustand persist to immediately update token for interceptor:
  // localStorage.setItem(APP_AUTH_TOKEN_KEY, response.data.access_token);
  return response.data;
};

export const logout = async (): Promise<void> => {
  // Call backend logout if it exists and is needed for app users
  // await appAxiosInstance.post(`${AUTH_API_BASE_URL_V1}/logout`);

  // Token removal from localStorage is handled by userSessionStore via persist middleware
  // when token is set to null.
  // This function can remain for API call if backend implements session invalidation.
  return Promise.resolve();
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await appAxiosInstance.get<User>(`${USERS_API_BASE_URL_V1}/me`);
  // Ensure the User interface here matches the fields returned by /api/v1/users/me
  // Map response field `name` to `username` if frontend User interface uses `username` primarily.
  if (response.data && response.data.name && !response.data.username) {
    response.data.username = response.data.name;
  }
  return response.data;
};

const appAuthService = {
  login,
  logout,
  getCurrentUser,
};

export default appAuthService;
