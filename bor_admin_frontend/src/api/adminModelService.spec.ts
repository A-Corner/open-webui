import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminModelService, {
  type ModelResponse,
  type ModelPullPayload,
  type ModelSettings,
  type ModelSettingsResponse,
  type ModelSettingsUpdatePayload,
} from './adminModelService'; // Adjust path
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
const ADMIN_MODELS_API_BASE_URL = '/api/v2/admin/models';

describe('Admin Model API Service (adminModelService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockModel: ModelResponse = {
    id: 'ollama/test-model:latest',
    name: 'Test Model',
    source: 'ollama',
    is_local: true,
    size: 1024 * 1024 * 50, // 50MB
    modified_at: new Date().toISOString(),
    details: { family: 'test', parameter_size: '7B', quantization_level: 'Q4_0' }
  };

  const mockModelSettings: ModelSettingsResponse = {
    default_models: ['ollama/test-model:latest'],
    model_order_list: ['ollama/test-model:latest'],
  };

  describe('getModels', () => {
    it('should fetch models, optionally filtered by source', async () => {
      const mockResponseData = [mockModel];
      mockedAxiosInstance.get.mockResolvedValue({ data: mockResponseData });

      // Test without source
      let result = await adminModelService.getModels();
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(ADMIN_MODELS_API_BASE_URL, { params: {} });
      expect(result).toEqual(mockResponseData);

      // Test with source
      result = await adminModelService.getModels('ollama');
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(ADMIN_MODELS_API_BASE_URL, { params: { source: 'ollama' } });
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('pullOllamaModel', () => {
    it('should send a pull request for an Ollama model', async () => {
      const payload: ModelPullPayload = { model_name: 'llama3:latest' };
      const mockApiResponse = { message: 'Pull initiated' }; // Example response
      mockedAxiosInstance.post.mockResolvedValue({ data: mockApiResponse });

      const result = await adminModelService.pullOllamaModel(payload);

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(`${ADMIN_MODELS_API_BASE_URL}/pull`, payload);
      expect(result).toEqual(mockApiResponse);
    });
  });

  describe('deleteOllamaModel', () => {
    it('should send a delete request for an Ollama model', async () => {
      const modelName = 'llama3:latest';
      const encodedModelName = encodeURIComponent(modelName);
      mockedAxiosInstance.delete.mockResolvedValue({}); // Void response

      await adminModelService.deleteOllamaModel(modelName);

      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith(`${ADMIN_MODELS_API_BASE_URL}/ollama/${encodedModelName}`);
    });
  });

  describe('getModelSettings', () => {
    it('should fetch model settings', async () => {
      mockedAxiosInstance.get.mockResolvedValue({ data: mockModelSettings });

      const result = await adminModelService.getModelSettings();

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(`${ADMIN_MODELS_API_BASE_URL}/settings`);
      expect(result).toEqual(mockModelSettings);
    });
  });

  describe('updateModelSettings', () => {
    it('should update model settings with the payload', async () => {
      const payload: ModelSettingsUpdatePayload = { default_models: ['ollama/new-default:latest'] };
      const updatedSettings = { ...mockModelSettings, ...payload };
      mockedAxiosInstance.put.mockResolvedValue({ data: updatedSettings });

      const result = await adminModelService.updateModelSettings(payload);

      expect(mockedAxiosInstance.put).toHaveBeenCalledWith(`${ADMIN_MODELS_API_BASE_URL}/settings`, payload);
      expect(result).toEqual(updatedSettings);
    });
  });

  it('should throw an error if an API call fails (getModels example)', async () => {
    const apiError = { response: { data: { detail: 'Model API Error' }, status: 500 } };
    mockedAxiosInstance.get.mockRejectedValue(apiError);

    await expect(adminModelService.getModels()).rejects.toEqual(apiError);
  });
});
