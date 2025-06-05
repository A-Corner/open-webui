import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSystemConfigStore } from './systemConfigStore'; // Adjust path
import adminConfigService, { type ConfigResponse, type ConfigItem } from '../api/adminConfigService'; // Adjust path

// Mock adminConfigService
vi.mock('../api/adminConfigService');

const mockAdminConfigService = adminConfigService as vi.Mocked<typeof adminConfigService>;

describe('System Config Store (useSystemConfigStore)', () => {
  beforeEach(() => {
    // Reset all mocks and the store state before each test
    vi.clearAllMocks();
    // Reset store to initial state
    useSystemConfigStore.setState({
      configs: null,
      isLoading: false,
      isUpdating: false,
      error: null,
    });
  });

  describe('fetchConfigs action', () => {
    it('should fetch configs and update store on success', async () => {
      const mockData: ConfigResponse = { configs: { 'test.key': 'testValue' } };
      mockAdminConfigService.getSystemConfigs.mockResolvedValue(mockData);

      await useSystemConfigStore.getState().fetchConfigs();

      expect(mockAdminConfigService.getSystemConfigs).toHaveBeenCalledTimes(1);
      expect(useSystemConfigStore.getState().configs).toEqual(mockData.configs);
      expect(useSystemConfigStore.getState().isLoading).toBe(false);
      expect(useSystemConfigStore.getState().error).toBeNull();
    });

    it('should set error state if fetching configs fails', async () => {
      const errorMessage = 'Failed to fetch';
      mockAdminConfigService.getSystemConfigs.mockRejectedValue(new Error(errorMessage));

      await useSystemConfigStore.getState().fetchConfigs();

      expect(useSystemConfigStore.getState().error).toContain(errorMessage); // Error message might be augmented
      expect(useSystemConfigStore.getState().isLoading).toBe(false);
      expect(useSystemConfigStore.getState().configs).toBeNull();
    });

    it('should set isLoading to true during fetch', async () => {
      mockAdminConfigService.getSystemConfigs.mockReturnValue(new Promise(() => {})); // Promise that never resolves for this check

      useSystemConfigStore.getState().fetchConfigs(); // Don't await

      expect(useSystemConfigStore.getState().isLoading).toBe(true);
    });
  });

  describe('updateConfigs action', () => {
    const configsToUpdate: ConfigItem[] = [{ key: 'test.key', value: 'newValue' }];

    it('should update configs and refresh store on success', async () => {
      const mockUpdatedData: ConfigResponse = { configs: { 'test.key': 'newValueUpdated' } };
      mockAdminConfigService.updateSystemConfigs.mockResolvedValue(mockUpdatedData);

      const result = await useSystemConfigStore.getState().updateConfigs(configsToUpdate);

      expect(mockAdminConfigService.updateSystemConfigs).toHaveBeenCalledWith({ configs: configsToUpdate });
      expect(useSystemConfigStore.getState().configs).toEqual(mockUpdatedData.configs);
      expect(useSystemConfigStore.getState().isUpdating).toBe(false);
      expect(useSystemConfigStore.getState().error).toBeNull();
      expect(result).toBe(true);
    });

    it('should set error state and return false if updating configs fails', async () => {
      const errorMessage = 'Failed to update';
      mockAdminConfigService.updateSystemConfigs.mockRejectedValue(new Error(errorMessage));

      const result = await useSystemConfigStore.getState().updateConfigs(configsToUpdate);

      expect(useSystemConfigStore.getState().error).toContain(errorMessage);
      expect(useSystemConfigStore.getState().isUpdating).toBe(false);
      expect(result).toBe(false);
    });

    it('should set isUpdating to true during update', async () => {
      mockAdminConfigService.updateSystemConfigs.mockReturnValue(new Promise(() => {}));
      useSystemConfigStore.getState().updateConfigs(configsToUpdate); // Don't await
      expect(useSystemConfigStore.getState().isUpdating).toBe(true);
    });
  });

  describe('setConfigValue action', () => {
    it('should optimistically update a config value in the store', () => {
      useSystemConfigStore.setState({ configs: { 'existing.key': 'oldValue' } });
      useSystemConfigStore.getState().setConfigValue('existing.key', 'newValue');
      expect(useSystemConfigStore.getState().configs!['existing.key']).toBe('newValue');

      useSystemConfigStore.getState().setConfigValue('new.key', 'anotherValue');
      expect(useSystemConfigStore.getState().configs!['new.key']).toBe('anotherValue');

      // Check if it doesn't wipe out other keys
      expect(useSystemConfigStore.getState().configs!['existing.key']).toBe('newValue');
    });

    it('should initialize configs if null when setConfigValue is called', () => {
      useSystemConfigStore.setState({ configs: null });
      useSystemConfigStore.getState().setConfigValue('a.new.key', 'a.value');
      expect(useSystemConfigStore.getState().configs!['a.new.key']).toBe('a.value');
    });
  });
});
