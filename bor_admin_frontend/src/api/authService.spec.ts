import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService, { type User, type LoginResponse } from './authService'; // Adjust path
import axiosInstance from './axiosInstance'; // We'll mock this

// Mock axiosInstance
vi.mock('./axiosInstance', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockedAxiosInstance = axiosInstance as vi.Mocked<typeof axiosInstance>;

describe('Auth API Service (authService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call login API with credentials and return data on success', async () => {
      const credentials = { username_or_email: 'test@example.com', password: 'password123' };
      const mockLoginResponse: LoginResponse = {
        access_token: 'fake-token',
        token_type: 'bearer',
        user: {
          id: '1', username: 'testuser', email: 'test@example.com', role: 'user',
          profile_image_url: '', is_active: true
        },
      };

      mockedAxiosInstance.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login(credentials);

      expect(mockedAxiosInstance.post).toHaveBeenCalledTimes(1);
      const expectedUrl = '/api/v1/auths/login/db'; // From authService.ts
      const expectedParams = new URLSearchParams();
      expectedParams.append('username', credentials.username_or_email);
      expectedParams.append('password', credentials.password);
      const expectedConfig = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(expectedUrl, expectedParams, expectedConfig);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw an error if login API call fails', async () => {
      const credentials = { username_or_email: 'test@example.com', password: 'password123' };
      const apiError = { response: { data: { detail: 'Invalid credentials' }, status: 400 } };
      mockedAxiosInstance.post.mockRejectedValue(apiError);

      await expect(authService.login(credentials)).rejects.toEqual(apiError);
    });
  });

  describe('logout', () => {
    it('should resolve (frontend-only or backend call placeholder)', async () => {
      // If backend logout is implemented and called by authService.logout:
      // mockedAxiosInstance.post.mockResolvedValue({});
      await expect(authService.logout()).resolves.toBeUndefined();
      // if (backend_logout_is_implemented) {
      //   expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/api/v1/auths/logout');
      // }
    });
  });

  describe('getCurrentUser', () => {
    it('should call /users/me API and return user data on success', async () => {
      const mockUser: User = {
        id: '1', username: 'currentuser', email: 'current@example.com', role: 'admin',
        profile_image_url: '', is_active: true
      };
      mockedAxiosInstance.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(mockedAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/api/v1/users/me');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if /users/me API call fails', async () => {
      const apiError = { response: { data: { detail: 'Token expired' }, status: 401 } };
      mockedAxiosInstance.get.mockRejectedValue(apiError);

      await expect(authService.getCurrentUser()).rejects.toEqual(apiError);
    });
  });
});
