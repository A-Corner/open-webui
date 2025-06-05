// bor_app_frontend/src/api/modelService.spec.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { appAxiosInstance } from './axiosInstance';
import { getSelectableChatModels } from './modelService';
import type { ChatModelResponse } from '../types/models';

// Mock appAxiosInstance
vi.mock('./axiosInstance', () => ({
  appAxiosInstance: {
    get: vi.fn(),
  },
}));

const mockedAxios = appAxiosInstance as any;

describe('modelService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getSelectableChatModels', () => {
    it('should fetch and map chat models correctly', async () => {
      const rawModelsFromAPI: Partial<ChatModelResponse>[] = [
        { id: 'ollama/llama3', name: 'Llama 3 (Ollama)', provider: 'ollama', description: 'Latest Llama model' },
        { id: 'openai/gpt-4', name: 'GPT-4 (OpenAI)', provider: 'openai_compatible' },
        { id: 'custom/model-x', provider: 'custom_provider' }, // Name might be missing
      ];
      mockedAxios.get.mockResolvedValue({ data: rawModelsFromAPI });

      const result = await getSelectableChatModels();

      expect(mockedAxios.get).toHaveBeenCalledWith('/models/selectable-chat');
      expect(result.length).toBe(3);

      expect(result[0]).toEqual({
        id: 'ollama/llama3',
        name: 'Llama 3 (Ollama)',
        provider: 'ollama',
        description: 'Latest Llama model',
      });
      expect(result[1].provider).toBe('openai_compatible');
      expect(result[2].name).toMatch(/模型 custom\/model-x/); // Default name mapping
    });

    it('should return an empty array if API returns non-array data', async () => {
      // This tests the Array.isArray check in the service
      mockedAxios.get.mockResolvedValue({ data: { message: "This is not an array" } });
      const result = await getSelectableChatModels();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('获取可选聊天模型列表错误: 响应数据不是数组格式', { message: "This is not an array" });
    });

    it('should throw an error if API call fails', async () => {
      mockedAxios.get.mockRejectedValue({ response: { data: { detail: 'API Error fetching models' } } });
      await expect(getSelectableChatModels()).rejects.toThrow('API Error fetching models');
    });

    it('should use default error message if detail is not available on API failure', async () => {
        mockedAxios.get.mockRejectedValue({ message: 'Network Error' }); // No response or response.data
        await expect(getSelectableChatModels()).rejects.toThrow('获取可选聊天模型失败');
      });
  });
});

// Mock console.error for the non-array data test
vi.spyOn(console, 'error').mockImplementation(() => {});
