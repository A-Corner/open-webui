import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom'; // For components using Link, if any
import SystemConfigsPage from './SystemConfigsPage'; // Adjust path
import { useSystemConfigStore } from '../../store/systemConfigStore'; // Adjust path
import type { ConfigValue, ConfigItem } from '../../api/adminConfigService'; // Adjust path

// Mock the systemConfigStore
const mockFetchConfigs = vi.fn();
const mockUpdateConfigs = vi.fn();
let mockStoreState: {
  configs: Record<string, ConfigValue> | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
} = {
  configs: null,
  isLoading: false,
  isUpdating: false,
  error: null,
};

vi.mock('../../store/systemConfigStore', () => ({
  useSystemConfigStore: vi.fn(() => ({
    ...mockStoreState,
    fetchConfigs: mockFetchConfigs,
    updateConfigs: mockUpdateConfigs,
  })),
}));

// Mock Ant Design message API
const mockMessageSuccess = vi.fn();
const mockMessageError = vi.fn();
const mockMessageInfo = vi.fn();
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd');
  return {
    ...antd,
    message: {
      success: mockMessageSuccess,
      error: mockMessageError,
      info: mockMessageInfo,
    },
  };
});

describe('SystemConfigsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state for each test
    mockStoreState = {
      configs: {
        'service.host': '0.0.0.0',
        'service.port': 8080,
        'ui.enable_signup': true,
        'frontend_branding.app_name': 'TestApp',
        'rag.chunk_size': 1000,
        'ollama.base_urls': ['http://localhost:11434'],
        'auth.jwt_expires_in_minutes': -1,
        'frontend_branding.meta_tags': { description: 'A test app', keywords: 'test, app' }
      },
      isLoading: false,
      isUpdating: false,
      error: null,
    };
    (useSystemConfigStore as any).mockImplementation(() => ({
      ...mockStoreState,
      fetchConfigs: mockFetchConfigs,
      updateConfigs: mockUpdateConfigs,
    }));
    document.body.innerHTML = ''; // Clean up DOM
  });

  afterEach(cleanup);

  const renderPage = () => render(<MemoryRouter><SystemConfigsPage /></MemoryRouter>);

  it('calls fetchConfigs on mount and displays initial config values in form fields', async () => {
    renderPage();
    expect(mockFetchConfigs).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByLabelText('Service > Host')).toHaveValue('0.0.0.0');
      expect(screen.getByLabelText('Service > Port')).toHaveValue(8080);
      expect(screen.getByLabelText('Ui > Enable Signup').querySelector('input[type="checkbox"]')).toBeChecked();
      expect(screen.getByLabelText('Frontend Branding > App Name')).toHaveValue('TestApp');
      expect(screen.getByLabelText('Rag > Chunk Size')).toHaveValue(1000);
      // For tags/textarea from array/object
      expect(screen.getByLabelText('Ollama > Base Urls').querySelector('.ant-select-selection-item-content')).toHaveTextContent('http://localhost:11434');
      expect(screen.getByLabelText('Frontend Branding > Meta Tags')).toHaveValue(JSON.stringify({ description: 'A test app', keywords: 'test, app' }, null, 2));
    });
  });

  it('groups configurations into tabs', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Service')).toBeInTheDocument(); // Tab label
      expect(screen.getByText('Ui')).toBeInTheDocument();
      expect(screen.getByText('Auth')).toBeInTheDocument();
      // Check that a field from a specific group is initially visible (e.g., service.host)
      expect(screen.getByLabelText('Service > Host')).toBeVisible();
    });
  });

  it('allows changing configuration values and calls updateConfigs on save', async () => {
    mockUpdateConfigs.mockResolvedValue(true); // Simulate successful update
    renderPage();
    await waitFor(() => expect(screen.getByLabelText('Service > Host')).toBeInTheDocument());

    await userEvent.clear(screen.getByLabelText('Service > Host'));
    await userEvent.type(screen.getByLabelText('Service > Host'), '127.0.0.1');

    const signupSwitch = screen.getByLabelText('Ui > Enable Signup').querySelector('input[type="checkbox"]');
    if (signupSwitch) await userEvent.click(signupSwitch); // Toggle it

    await userEvent.click(screen.getByRole('button', { name: /save all changes/i }));

    await waitFor(() => {
      expect(mockUpdateConfigs).toHaveBeenCalledTimes(1);
      const expectedPayload: ConfigItem[] = [
        { key: 'service.host', value: '127.0.0.1' },
        { key: 'ui.enable_signup', value: false }, // It was true, toggled to false
      ];
      // Check if mockUpdateConfigs was called with an array containing these items
      // The order might vary, and other non-dirty items might not be sent depending on formState.isDirty usage
      // For simplicity, checking for a subset of changes. A more robust check would inspect the actual call argument.
      expect(mockUpdateConfigs.mock.calls[0][0]).toEqual(expect.arrayContaining(expectedPayload));
      expect(mockMessageSuccess).toHaveBeenCalledWith('Configurations updated successfully!');
      expect(mockFetchConfigs).toHaveBeenCalledTimes(2); // Initial + refresh after save
    });
  });

  it('handles JSON parsing for textarea fields on submit', async () => {
    mockUpdateConfigs.mockResolvedValue(true);
    renderPage();
    await waitFor(() => expect(screen.getByLabelText('Frontend Branding > Meta Tags')).toBeInTheDocument());

    const metaTagsTextarea = screen.getByLabelText('Frontend Branding > Meta Tags');
    await userEvent.clear(metaTagsTextarea);
    const newMetaJson = '{\n  "description": "New Description",\n  "keywords": "new,key"\n}';
    await userEvent.type(metaTagsTextarea, newMetaJson);

    await userEvent.click(screen.getByRole('button', { name: /save all changes/i }));

    await waitFor(() => {
        expect(mockUpdateConfigs).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ key: 'frontend_branding.meta_tags', value: JSON.parse(newMetaJson) })
            ])
        );
    });
  });

  it('shows error message if updateConfigs fails', async () => {
    const updateErrorMsg = 'Update failed miserably';
    mockUpdateConfigs.mockResolvedValue(false); // Simulate failed update
    // Simulate error being set in store after failed update
    (useSystemConfigStore as any).mockImplementation(() => ({
        ...mockStoreState,
        fetchConfigs: mockFetchConfigs,
        updateConfigs: mockUpdateConfigs,
        error: updateErrorMsg, // Store now has the error from updateConfigs action
    }));


    renderPage();
    await waitFor(() => expect(screen.getByLabelText('Service > Host')).toBeInTheDocument());
    await userEvent.clear(screen.getByLabelText('Service > Host'));
    await userEvent.type(screen.getByLabelText('Service > Host'), '1.2.3.4');
    await userEvent.click(screen.getByRole('button', { name: /save all changes/i }));

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith(updateErrorMsg);
    });
  });

  it('shows loading state on Save button when isUpdating is true', () => {
    mockStoreState.isUpdating = true;
    (useSystemConfigStore as any).mockImplementation(() => ({
        ...mockStoreState,
        fetchConfigs: mockFetchConfigs,
        updateConfigs: mockUpdateConfigs,
    }));
    renderPage();
    const saveButton = screen.getByRole('button', { name: /save all changes/i });
    expect(saveButton).toBeDisabled(); // AntD button is disabled when loading
    expect(saveButton.querySelector('.ant-btn-loading-icon')).toBeInTheDocument();
  });

});
