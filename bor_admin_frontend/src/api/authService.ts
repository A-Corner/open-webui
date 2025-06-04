import axiosInstance from './axiosInstance';

// Interfaces (should ideally be in a central types/interfaces file)
export interface User {
  id: string;
  username: string; // Mapped from 'name' in DB
  email: string;
  role: string;
  profile_image_url?: string;
  is_active?: boolean; // From new v2 UserResponse
  created_at?: string | number; // Timestamps might be numbers (epoch) or ISO strings
  updated_at?: string | number;
  last_active_at?: string | number | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User; // Assuming the /login/db endpoint returns user info
}

// V1 Endpoints are used for login as per plan
const AUTH_API_BASE_URL_V1 = '/api/v1/auths';
const USERS_API_BASE_URL_V1 = '/api/v1/users';


// Login with username/email and password
// Using the /login/db endpoint as specified for database users
export const login = async (credentials: {
  username_or_email: string;
  password: string;
}): Promise<LoginResponse> => {
  // The backend /login/db endpoint expects 'username' and 'password' in a FormData
  // This might need adjustment if it strictly requires FormData vs JSON.
  // For now, assuming it can take JSON or that axios handles FormData conversion if needed.
  // FastAPI typically handles JSON request bodies well for Pydantic models.
  // Let's check the v1 /login/db signature. It uses OAuth2PasswordRequestForm.
  // Axios typically sends JSON. For form data, specific header and data formatting is needed.

  const params = new URLSearchParams();
  params.append('username', credentials.username_or_email); // FastAPI's OAuth2PasswordRequestForm expects 'username' field
  params.append('password', credentials.password);

  const response = await axiosInstance.post(`${AUTH_API_BASE_URL_V1}/login/db`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data; // response.data should match LoginResponse
};

// Logout (Frontend only for now, or can call a backend endpoint if it exists)
export const logout = async (): Promise<void> => {
  // If backend has a /logout endpoint that invalidates session/token:
  // await axiosInstance.post(`${AUTH_API_BASE_URL_V1}/logout`);

  // For now, primarily a frontend action (token removal will be in store)
  localStorage.removeItem('admin_auth_token'); // Example direct localStorage interaction
  return Promise.resolve();
};

// Get current user information (validates token and returns user)
export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosInstance.get<User>(`${USERS_API_BASE_URL_V1}/me`);
  // The User interface above should match the response of /users/me
  // The backend /api/v1/users/me returns UserModel which includes:
  // id, name, email, role, profile_image_url, last_active_at, updated_at, created_at, api_key, settings, info, oauth_sub
  // We need to ensure our frontend User interface aligns or map fields.
  // The UserResponse from v2 admin users has 'username' and 'is_active'.
  // For now, this User interface is a general one.
  return response.data;
};

const authService = {
  login,
  logout,
  getCurrentUser,
};

export default authService;
