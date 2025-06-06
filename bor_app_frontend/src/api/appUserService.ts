// bor_app_frontend/src/api/appUserService.ts
import { appAxiosInstance } from './axiosInstance';
import type { User } from '../types/user'; // Assuming User type is in types/user.ts

// 中文注释：提供与当前登录用户相关的API交互 (个人资料更新等)

/**
 * 获取当前登录用户的信息.
 * Note: This function might be redundant if userSessionStore already fetches and stores this.
 * However, having it here can be useful for direct API calls if needed.
 * The userSessionStore.user object should be the primary source of user data in components.
 */
export const getMyProfile = async (): Promise<User> => {
  try {
    const response = await appAxiosInstance.get<User>('/users/me');
    return response.data;
  } catch (error: any) {
    console.error('获取用户信息错误:', error.original || error);
    const message = error.friendlyMessage || error.response?.data?.detail || '获取用户信息失败';
    throw new Error(message);
  }
};

/**
 * 更新当前用户信息 (例如名称, 邮箱).
 * Backend should ignore fields like ID, role if they are not user-modifiable.
 * @param data 要更新的用户字段 (e.g., { name?: string; email?: string })
 */
export const updateMyProfile = async (data: Partial<Pick<User, 'name' | 'email'>>): Promise<User> => {
  try {
    const response = await appAxiosInstance.put<User>('/users/me', data);
    return response.data;
  } catch (error: any) {
    console.error('更新用户信息错误:', error.original || error);
    const message = error.friendlyMessage || error.response?.data?.detail || '更新用户信息失败';
    throw new Error(message);
  }
};

/**
 * 上传用户头像.
 * Assumes backend endpoint like /api/v1/users/me/profile-image or /api/v1/users/me/avatar
 * @param file 图片文件
 * @returns Object containing the new profile_image_url
 */
export const uploadMyAvatar = async (file: File): Promise<{ profile_image_url: string }> => {
    const formData = new FormData();
    formData.append('file', file); // 'file' is a common field name for uploads
    try {
        // The endpoint might vary, e.g., /users/me/avatar or /users/me/profile-image
        const response = await appAxiosInstance.post<{ profile_image_url: string }>('/users/me/profile-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error: any) {
        console.error('上传头像错误:', error.original || error);
        const message = error.friendlyMessage || error.response?.data?.detail || '上传头像失败';
        throw new Error(message);
    }
};
