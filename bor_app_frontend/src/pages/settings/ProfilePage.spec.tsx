// bor_app_frontend/src/pages/settings/ProfilePage.spec.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigProvider, theme as antdTheme, message as antdMessage } from 'antd';
import ProfilePage from './ProfilePage'; // Adjust path if needed
import { useUserSessionStore } from '../../store/userSessionStore';
import * as appUserService from '../../api/appUserService'; // Mock the entire module
import type { User } from '../../types/user';

// Mock antd message globally
vi.mock('antd', async (importOriginal) => {
    const antd = await importOriginal<typeof import('antd')>();
    return {
        ...antd,
        message: {
            ...antd.message,
            success: vi.fn(),
            error: vi.fn(),
            info: vi.fn(),
        },
    };
});

// Mock stores and services
vi.mock('../../store/userSessionStore');
vi.mock('../../api/appUserService');

const mockUser: User = {
  id: 'user123',
  name: 'Current User',
  email: 'current@example.com',
  role: 'user',
  profile_image_url: 'http://example.com/avatar.jpg',
};

const mockSetUser = vi.fn();
const mockGetMyProfile = appUserService.getMyProfile as vi.Mock;
const mockUpdateMyProfile = appUserService.updateMyProfile as vi.Mock;
const mockUploadMyAvatar = appUserService.uploadMyAvatar as vi.Mock;


// Helper to render with AntD ConfigProvider
const renderWithAntD = (component: React.ReactElement) => {
  return render(
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm }}>
      {component}
    </ConfigProvider>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useUserSessionStore as any).mockReturnValue({
      user: mockUser,
      setUser: mockSetUser,
      token: 'fake-token', // Needed for useEffect to fetch profile initially if user is partial
    });
    mockGetMyProfile.mockResolvedValue(mockUser); // Default successful fetch
  });

  it('renders user information correctly', async () => {
    renderWithAntD(<ProfilePage />);
    await waitFor(() => expect(screen.getByText(mockUser.name)).toBeInTheDocument());
    expect(screen.getByText(mockUser.email)).toBeInTheDocument());
    expect(screen.getByText(mockUser.role)).toBeInTheDocument());
    expect(screen.getByRole('img', { name: 'user' })).toHaveAttribute('src', mockUser.profile_image_url);
  });

  it('fetches user profile if initial user data is minimal', async () => {
    (useUserSessionStore as any).mockReturnValue({
      user: { id: 'user123', name: 'Partial User' }, // Minimal user, no email for example
      setUser: mockSetUser,
      token: 'fake-token',
    });
    const fullUser = { ...mockUser, email: 'fetched@example.com' };
    mockGetMyProfile.mockResolvedValue(fullUser);

    renderWithAntD(<ProfilePage />);

    await waitFor(() => expect(mockGetMyProfile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockSetUser).toHaveBeenCalledWith(fullUser));
    await waitFor(() => expect(screen.getByText(fullUser.email)).toBeInTheDocument());
  });

  it('switches to edit mode and populates form', async () => {
    renderWithAntD(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('编辑信息')).toBeInTheDocument());
    fireEvent.click(screen.getByText('编辑信息'));

    expect(screen.getByLabelText('用户名')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText('保存更改')).toBeInTheDocument();
  });

  it('handles profile update successfully', async () => {
    mockUpdateMyProfile.mockResolvedValue({ ...mockUser, name: 'Updated Name' });
    renderWithAntD(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('编辑信息')).toBeInTheDocument());
    fireEvent.click(screen.getByText('编辑信息'));

    await waitFor(() => fireEvent.change(screen.getByLabelText('用户名'), { target: { value: 'Updated Name' } }));
    fireEvent.click(screen.getByText('保存更改'));

    await waitFor(() => expect(mockUpdateMyProfile).toHaveBeenCalledWith({ name: 'Updated Name', email: mockUser.email }));
    await waitFor(() => expect(mockSetUser).toHaveBeenCalledWith({ ...mockUser, name: 'Updated Name' }));
    await waitFor(() => expect(antdMessage.success).toHaveBeenCalledWith('个人信息更新成功!'));
    await waitFor(() => expect(screen.queryByText('保存更改')).not.toBeInTheDocument()); // Back to view mode
  });

  it('handles profile update failure', async () => {
    mockUpdateMyProfile.mockRejectedValue(new Error('Update Failed'));
    renderWithAntD(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('编辑信息')).toBeInTheDocument());
    fireEvent.click(screen.getByText('编辑信息'));

    fireEvent.change(screen.getByLabelText('用户名'), { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByText('保存更改'));

    await waitFor(() => expect(mockUpdateMyProfile).toHaveBeenCalled());
    await waitFor(() => expect(antdMessage.error).toHaveBeenCalledWith('Update Failed'));
    expect(screen.getByText('保存更改')).toBeInTheDocument(); // Still in edit mode
  });

  it('handles avatar upload successfully', async () => {
    mockUploadMyAvatar.mockResolvedValue({ profile_image_url: 'http://example.com/new_avatar.png' });
    const mockFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    renderWithAntD(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('更换头像')).toBeInTheDocument());

    const uploadButton = screen.getByText('更换头像').closest('button')?.parentElement?.querySelector('input[type="file"]');
    expect(uploadButton).toBeDefined();

    if (uploadButton) {
       fireEvent.change(uploadButton, { target: { files: [mockFile] } });
    }

    await waitFor(() => expect(mockUploadMyAvatar).toHaveBeenCalledWith(mockFile));
    await waitFor(() => expect(mockSetUser).toHaveBeenCalledWith({ ...mockUser, profile_image_url: 'http://example.com/new_avatar.png' }));
    await waitFor(() => expect(antdMessage.success).toHaveBeenCalledWith('头像上传成功!'));
  });

   it('handles avatar upload failure', async () => {
    mockUploadMyAvatar.mockRejectedValue(new Error('Upload Failed'));
    const mockFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    renderWithAntD(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('更换头像')).toBeInTheDocument());
    const uploadButton = screen.getByText('更换头像').closest('button')?.parentElement?.querySelector('input[type="file"]');
    if (uploadButton) {
        fireEvent.change(uploadButton, { target: { files: [mockFile] } });
    }
    await waitFor(() => expect(mockUploadMyAvatar).toHaveBeenCalled());
    await waitFor(() => expect(antdMessage.error).toHaveBeenCalledWith('Upload Failed'));
  });
});
