// bor_app_frontend/src/pages/settings/AppearanceSettingsPage.spec.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConfigProvider, theme as antdTheme } from 'antd';
import AppearanceSettingsPage from './AppearanceSettingsPage'; // Adjust path if needed
import { useUserSettingsStore } from '../../store/userSettingsStore';
import type { ThemePreference } from '../../types/settings';

// Mock userSettingsStore
vi.mock('../../store/userSettingsStore');

const mockSetTheme = vi.fn();

// Helper to render with AntD ConfigProvider
const renderWithAntD = (component: React.ReactElement) => {
  return render(
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm }}>
      {component}
    </ConfigProvider>
  );
};

describe('AppearanceSettingsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useUserSettingsStore as any).mockReturnValue({
      theme: 'system' as ThemePreference, // Default theme for testing
      setTheme: mockSetTheme,
    });
  });

  it('renders theme options correctly and shows current theme selection', () => {
    renderWithAntD(<AppearanceSettingsPage />);

    expect(screen.getByText('应用主题')).toBeInTheDocument();
    expect(screen.getByText('选择您偏好的应用界面主题。')).toBeInTheDocument();

    // Check if radio buttons are rendered
    const lightRadio = screen.getByRole('radio', { name: '明亮' });
    const darkRadio = screen.getByRole('radio', { name: '暗黑' });
    const systemRadio = screen.getByRole('radio', { name: '跟随系统' });

    expect(lightRadio).toBeInTheDocument();
    expect(darkRadio).toBeInTheDocument();
    expect(systemRadio).toBeInTheDocument();

    // Check if 'system' (the mocked current theme) is selected
    // AntD Radio.Button wraps input, check parent or input's checked status
    expect(systemRadio).toBeChecked();
    expect(lightRadio).not.toBeChecked();
    expect(darkRadio).not.toBeChecked();
  });

  it('calls setTheme with "light" when Light theme radio button is clicked', () => {
    renderWithAntD(<AppearanceSettingsPage />);
    const lightRadio = screen.getByRole('radio', { name: '明亮' });
    fireEvent.click(lightRadio);
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with "dark" when Dark theme radio button is clicked', () => {
    renderWithAntD(<AppearanceSettingsPage />);
    const darkRadio = screen.getByRole('radio', { name: '暗黑' });
    fireEvent.click(darkRadio);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with "system" when System theme radio button is clicked', () => {
    // Change initial mock theme to something else to see the change
    (useUserSettingsStore as any).mockReturnValue({
        theme: 'light' as ThemePreference,
        setTheme: mockSetTheme,
      });
    renderWithAntD(<AppearanceSettingsPage />);
    const systemRadio = screen.getByRole('radio', { name: '跟随系统' });
    fireEvent.click(systemRadio);
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('updates radio button selection when theme changes in store', () => {
    const { rerender } = renderWithAntD(<AppearanceSettingsPage />);

    // Initial: 'system' is checked
    expect(screen.getByRole('radio', { name: '跟随系统' })).toBeChecked();

    // Simulate store theme changing to 'dark'
    (useUserSettingsStore as any).mockReturnValue({
      theme: 'dark' as ThemePreference,
      setTheme: mockSetTheme,
    });
    rerender(
        <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm }}>
            <AppearanceSettingsPage />
        </ConfigProvider>
    );

    expect(screen.getByRole('radio', { name: '暗黑' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '跟随系统' })).not.toBeChecked();
  });
});
