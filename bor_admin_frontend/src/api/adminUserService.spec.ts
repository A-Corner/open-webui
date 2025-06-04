import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminUserService, {
  type User, type UserListResponse, type UserCreatePayload, type UserUpdatePayload, type SetPasswordPayload
} from './adminUserService'; // Adjust path
import axiosInstance from './axiosInstance'; // We'll mock this

// Mock axiosInstance
vi.mock('./axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAxiosInstance = axiosInstance as vi.Mocked<typeof axiosInstance>;
const ADMIN_USERS_API_BASE_URL_V2 = '/api/v2/admin/users';

describe('Admin User API Service (adminUserService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should call getUsers API with parameters and return user list response', async () => {
      const params = { page: 1, per_page: 10, query: 'test', role: 'admin', is_active: true };
      const mockResponse: UserListResponse = {
        users: [], total: 0, page: 1, per_page: 10,
      };
      mockedAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await adminUserService.getUsers(params);

      expect(mockedAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(ADMIN_USERS_API_BASE_URL_V2, { params });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createUser', () => {
    it('should call createUser API with payload and return new user', async () => {
      const payload: UserCreatePayload = { username: 'newbie', email: 'new@example.com', password: 'password123' };
      const mockUser: User = { id: '3', username: 'newbie', email: 'new@example.com', role: 'user', is_active: true };
      mockedAxiosInstance.post.mockResolvedValue({ data: mockUser });

      const result = await adminUserService.createUser(payload);

      expect(mockedAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(ADMIN_USERS_API_BASE_URL_V2, payload);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserById', () => {
    it('should call getUserById API and return user data', async () => {
      const userId = '123';
      const mockUser: User = { id: userId, username: 'test', email: 'test@example.com', role: 'user', is_active: true };
      mockedAxiosInstance.get.mockResolvedValue({ data: mockUser });

      const result = await adminUserService.getUserById(userId);

      expect(mockedAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(`${ADMIN_USERS_API_BASE_URL_V2}/${userId}`);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should call updateUser API with payload and return updated user', async () => {
      const userId = '123';
      const payload: UserUpdatePayload = { email: 'updated@example.com', role: 'admin' };
      const mockUser: User = { id: userId, username: 'test', email: 'updated@example.com', role: 'admin', is_active: true };
      mockedAxiosInstance.put.mockResolvedValue({ data: mockUser });

      const result = await adminUserService.updateUser(userId, payload);

      expect(mockedAxiosInstance.put).toHaveBeenCalledTimes(1);
      expect(mockedAxiosInstance.put).toHaveBeenCalledWith(`${ADMIN_USERS_API_BASE_URL_V2}/${userId}`, payload);
      expect(result).toEqual(mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should call deleteUser API', async () => {
      const userId = '123';
      mockedAxiosInstance.delete.mockResolvedValue({ data: null }); // void response

      await adminUserService.deleteUser(userId);

      expect(mockedAxiosInstance.delete).toHaveBeenCalledTimes(1);
      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith(`${ADMIN_USERS_API_BASE_URL_V2}/${userId}`);
    });
  });

  describe('setUserPassword', () => {
    it('should call setUserPassword API with payload', async () => {
      const userId = '123';
      const payload: SetPasswordPayload = { new_password: 'newStrongPassword123' };
      mockedAxiosInstance.post.mockResolvedValue({ data: null }); // void response

      await adminUserService.setUserPassword(userId, payload);

      expect(mockedAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(`${ADMIN_USERS_API_BASE_URL_V2}/${userId}/set-password`, payload);
    });
  });

  // Generic error handling tests (can be applied to one method or all if behavior is consistent)
  it('should throw an error if any API call fails', async () => {
    const apiError = { response: { data: { detail: 'Generic API Error' }, status: 500 } };
    mockedAxiosInstance.get.mockRejectedValue(apiError); // Example for getUsers

    await expect(adminUserService.getUsers({})).rejects.toEqual(apiError);
  });
});
