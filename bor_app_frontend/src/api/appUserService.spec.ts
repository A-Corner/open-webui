// bor_app_frontend/src/api/appUserService.spec.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { appAxiosInstance } from './axiosInstance';
import { getMyProfile, updateMyProfile, uploadMyAvatar } from './appUserService';
import type { User } from '../types/user'; // Assuming User type is defined

// Mock appAxiosInstance
vi.mock('./axiosInstance', () => ({
  appAxiosInstance: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedAxios = appAxiosInstance as any;

describe('appUserService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getMyProfile', () => {
    it('should fetch the current user profile', async () => {
      const mockUser: User = { id: 'user1', name: 'Test User', email: 'test@example.com', role: 'user', profile_image_url: 'http://example.com/avatar.png' };
      mockedAxios.get.mockResolvedValue({ data: mockUser });

      const result = await getMyProfile();

      expect(mockedAxios.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if API fails', async () => {
      mockedAxios.get.mockRejectedValue({ response: { data: { detail: 'Fetch Profile Error' } } });
      await expect(getMyProfile()).rejects.toThrow('Fetch Profile Error');
    });
  });

  describe('updateMyProfile', () => {
    it('should send a PUT request to update user profile and return updated user', async () => {
      const profileUpdateData: Partial<Pick<User, 'name' | 'email'>> = { name: 'Updated Name' };
      const updatedUser: User = { id: 'user1', name: 'Updated Name', email: 'test@example.com', role: 'user' };
      mockedAxios.put.mockResolvedValue({ data: updatedUser });

      const result = await updateMyProfile(profileUpdateData);

      expect(mockedAxios.put).toHaveBeenCalledWith('/users/me', profileUpdateData);
      expect(result).toEqual(updatedUser);
    });

    it('should throw an error if API fails', async () => {
      mockedAxios.put.mockRejectedValue({ response: { data: { detail: 'Update Profile Error' } } });
      await expect(updateMyProfile({ name: 'Test' })).rejects.toThrow('Update Profile Error');
    });
  });

  describe('uploadMyAvatar', () => {
    it('should send a POST request with FormData to upload avatar and return new URL', async () => {
      const mockFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });
      const responseData = { profile_image_url: 'http://example.com/new_avatar.png' };
      mockedAxios.post.mockResolvedValue({ data: responseData });

      const result = await uploadMyAvatar(mockFile);

      expect(mockedAxios.post).toHaveBeenCalledWith('/users/me/profile-image', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Check if FormData contains the file (optional, more complex to assert FormData content)
      const formData = mockedAxios.post.mock.calls[0][1] as FormData;
      expect(formData.get('file')).toEqual(mockFile);

      expect(result).toEqual(responseData);
    });

    it('should throw an error if API fails', async () => {
      const mockFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });
      mockedAxios.post.mockRejectedValue({ response: { data: { detail: 'Upload Avatar Error' } } });
      await expect(uploadMyAvatar(mockFile)).rejects.toThrow('Upload Avatar Error');
    });
  });
});
