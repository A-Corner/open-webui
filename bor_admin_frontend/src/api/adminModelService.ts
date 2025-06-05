import axiosInstance from './axiosInstance'; // Assuming this is configured

const ADMIN_MODELS_API_BASE_URL = '/api/v2/admin/models';

export interface ModelResponse {
  id: string; // e.g., "ollama/llama3:latest" or "openai_compatible/gpt-4o"
  name: string; // Display name, often derived from ID
  source: 'ollama' | 'openai_compatible' | 'huggingface_sentence_transformer' | string;
  is_local?: boolean; // Especially for Ollama models
  size?: number; // Size in bytes for local models
  modified_at?: string; // ISO date string for Ollama models
  // Other metadata like parameters, capabilities, etc. might be part of a detailed view
  // For lists, keep it concise.
  details?: Record<string, any>; // For Ollama, this might contain family, parameter_size, quantization_level
}

export interface ModelPullPayload {
  model_name: string; // e.g., "llama3:latest" or "ollama/llama3:latest" for clarity on source if ambiguous
  // source?: 'ollama'; // Backend might infer from model_name format or require it
}

export interface ModelSettings {
  default_models?: string[]; // Model IDs, e.g., ["ollama/llama3:latest", "openai_compatible/gpt-4o"]
  model_order_list?: string[]; // User-defined order of model IDs
}

export type ModelSettingsResponse = ModelSettings;
export type ModelSettingsUpdatePayload = Partial<ModelSettings>;

// API Service Functions

export const getModels = async (source?: string): Promise<ModelResponse[]> => {
  const params: Record<string, string> = {};
  if (source) {
    params.source = source;
  }
  const response = await axiosInstance.get<ModelResponse[]>(ADMIN_MODELS_API_BASE_URL, { params });
  return response.data;
};

export const pullOllamaModel = async (data: ModelPullPayload): Promise<any> => {
  // The backend might return a task ID for polling, or a streaming response,
  // or just a 202 Accepted. For now, assuming a simple response.
  const response = await axiosInstance.post(`${ADMIN_MODELS_API_BASE_URL}/pull`, data);
  return response.data; // Or handle specific status codes like 202
};

export const deleteOllamaModel = async (modelName: string): Promise<void> => {
  // modelName needs to be URL encoded if it contains slashes or colons.
  // Example: "ollama/llama3:latest" -> "ollama%2Fllama3%3Alatest" (though path params usually handle this)
  // The backend router path is /ollama/{model_name:path}, so FastAPI should handle decoding.
  // We just need to ensure the modelName is correctly formatted for the path segment.
  // If model_name is like "namespace/model:tag", it's part of the path.
  // The API path is /api/v2/admin/models/ollama/{model_name}
  // So, modelName here should be "llama3:latest", not "ollama/llama3:latest"
  // The service function should abstract this if needed.
  // For now, assuming modelName is what the API expects directly after /ollama/
  const encodedModelName = encodeURIComponent(modelName); // Ensure it's safe for URL path segment
  await axiosInstance.delete(`${ADMIN_MODELS_API_BASE_URL}/ollama/${encodedModelName}`);
};

export const getModelSettings = async (): Promise<ModelSettingsResponse> => {
  const response = await axiosInstance.get<ModelSettingsResponse>(`${ADMIN_MODELS_API_BASE_URL}/settings`);
  return response.data;
};

export const updateModelSettings = async (data: ModelSettingsUpdatePayload): Promise<ModelSettingsResponse> => {
  const response = await axiosInstance.put<ModelSettingsResponse>(`${ADMIN_MODELS_API_BASE_URL}/settings`, data);
  return response.data;
};

const adminModelService = {
  getModels,
  pullOllamaModel,
  deleteOllamaModel,
  getModelSettings,
  updateModelSettings,
};

export default adminModelService;
