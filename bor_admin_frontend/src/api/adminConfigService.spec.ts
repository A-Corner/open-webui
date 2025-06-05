import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminConfigService, {
  type ConfigResponse,
  type ConfigUpdateRequest,
  type ConfigItem,
  type ConfigValue
} from './adminConfigService'; // Adjust path
import axiosInstance from './axiosInstance'; // We'll mock this

// Mock axiosInstance
vi.mock('./axiosInstance', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedAxiosInstance = axiosInstance as vi.Mocked<typeof axiosInstance>;
const ADMIN_SYSTEM_CONFIGS_API_BASE_URL = '/api/v2/admin/system-configs';

describe('Admin Config API Service (adminConfigService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSystemConfigs', () => {
    it('should call getSystemConfigs API and return config response', async () => {
      const mockResponse: ConfigResponse = {
        configs: { 'ui.enable_signup': true, 'service.port': 8080 },
      };
      mockedAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await adminConfigService.getSystemConfigs();

      expect(mockedAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(ADMIN_SYSTEM_CONFIGS_API_BASE_URL);
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error if getSystemConfigs API call fails', async () => {
      const apiError = { response: { data: { detail: 'Server error' }, status: 500 } };
      mockedAxiosInstance.get.mockRejectedValue(apiError);

      await expect(adminConfigService.getSystemConfigs()).rejects.toEqual(apiError);
    });
  });

  describe('updateSystemConfigs', () => {
    it('should call updateSystemConfigs API with payload and return updated config response', async () => {
      const payload: ConfigUpdateRequest = {
        configs: [{ key: 'ui.enable_signup', value: false }],
      };
      const mockResponse: ConfigResponse = {
        configs: { 'ui.enable_signup': false, 'service.port': 8080 },
      };
      mockedAxiosInstance.put.mockResolvedValue({ data: mockResponse });

      const result = await adminConfigService.updateSystemConfigs(payload);

      expect(mockedAxiosInstance.put).toHaveBeenCalledTimes(1);
      expect(mockedAxiosInstance.put).toHaveBeenCalledWith(ADMIN_SYSTEM_CONFIGS_API_BASE_URL, payload);
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error if updateSystemConfigs API call fails', async () => {
      const payload: ConfigUpdateRequest = {
        configs: [{ key: 'ui.enable_signup', value: false }],
      };
      const apiError = { response: { data: { detail: 'Validation error' }, status: 400 } };
      mockedAxiosInstance.put.mockRejectedValue(apiError);

      await expect(adminConfigService.updateSystemConfigs(payload)).rejects.toEqual(apiError);
    });
  });
});
