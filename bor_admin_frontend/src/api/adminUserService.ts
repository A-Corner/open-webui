import axiosInstance from './axiosInstance'; // Assuming this is configured
import type { User } from './authService'; // Re-using User type from authService, or define a more specific AdminUser one if needed

// V2 Admin Users API base URL
const ADMIN_USERS_API_BASE_URL_V2 = '/api/v2/admin/users';

// Interfaces based on backend Pydantic models for V2 User Management

export interface UserListResponse {
  users: User[]; // Re-using the User interface from authService for now
  total: number;
  page: number;
  per_page: number;
}

export interface UserCreatePayload {
  username: string;
  email: string;
  password?: string;      // Send plain password
  role?: string;
  is_active?: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  role?: string;
  is_active?: boolean;
  // username is typically not updated via this kind of payload
}

export interface SetPasswordPayload {
  new_password: string;
}

// API Service Functions

export const getUsers = async (params: {
  page?: number;
  per_page?: number;
  query?: string;
  role?: string;
  is_active?: boolean;
}): Promise<UserListResponse> => {
  const response = await axiosInstance.get<UserListResponse>(ADMIN_USERS_API_BASE_URL_V2, { params });
  return response.data;
};

export const createUser = async (data: UserCreatePayload): Promise<User> => {
  const response = await axiosInstance.post<User>(ADMIN_USERS_API_BASE_URL_V2, data);
  return response.data;
};

export const getUserById = async (userId: string): Promise<User> => {
  const response = await axiosInstance.get<User>(`${ADMIN_USERS_API_BASE_URL_V2}/${userId}`);
  return response.data;
};

export const updateUser = async (userId: string, data: UserUpdatePayload): Promise<User> => {
  const response = await axiosInstance.put<User>(`${ADMIN_USERS_API_BASE_URL_V2}/${userId}`, data);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await axiosInstance.delete(`${ADMIN_USERS_API_BASE_URL_V2}/${userId}`);
};

export const setUserPassword = async (userId: string, data: SetPasswordPayload): Promise<void> => {
  await axiosInstance.post(`${ADMIN_USERS_API_BASE_URL_V2}/${userId}/set-password`, data);
};

const adminUserService = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  setUserPassword,
};

export default adminUserService;
