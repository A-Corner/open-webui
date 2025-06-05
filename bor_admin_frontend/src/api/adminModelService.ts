import axiosInstance from './axiosInstance'; // Assuming this is configured

const ADMIN_MODELS_API_BASE_URL = '/api/v2/admin/models';
const ADMIN_REMOTE_SERVICES_API_BASE_URL = `${ADMIN_MODELS_API_BASE_URL}/remote-services`; // New base for remote services

export interface ModelResponse {
  id: string;
  name: string;
  source: 'ollama' | 'openai_compatible' | 'huggingface_transformer' | string;
  is_local?: boolean;
  size?: number;
  modified_at?: string;
  family?: string;
  parameter_size?: string;
  quantization_level?: string;
  description?: string;
  // for openai_compatible (or other remote services)
  api_base_url?: string;
  api_key_set?: boolean;
  service_id?: string; // ID of the remote service configuration, if applicable
  details?: Record<string, any>;
}

export interface ModelPullPayload {
  model_name: string;
}

export interface ModelPullResponse { // Enhanced response for pull
  status: "pulling_started" | "already_exists" | "error";
  message: string;
  model_name?: string;
  task_id?: string;
}

// For Remote Model Service Configuration
export interface RemoteServiceResponse extends ModelResponse { // Can extend ModelResponse or be separate
    // service_id is already in ModelResponse if we use that.
    // If ModelResponse is purely for listed models, then a dedicated RemoteServiceResponse is better.
    // For now, let's assume ModelResponse is flexible enough or we create a dedicated one.
    // Let's use a more specific one for clarity for CRUD of service configurations:
}

export interface RemoteModelServiceConfig {
    id: string; // service_id, usually UUID or DB id
    name: string; // User-defined name for this configuration
    api_base_url: string;
    api_key_set?: boolean; // To indicate if a key is configured (key itself not sent)
    description?: string;
    source_type: 'openai_compatible' | string; // e.g., 'anthropic', 'groq', etc.
    // Potentially other metadata like associated models if API provides link
}
export interface RemoteModelServiceCreatePayload {
  name: string;
  api_base_url: string;
  api_key?: string; // Sent on create/update only
  description?: string;
  source_type: 'openai_compatible' | string;
}
export type RemoteModelServiceUpdatePayload = Partial<RemoteModelServiceCreatePayload>;


export interface ModelSettings {
  default_models?: string[]; // Model IDs, e.g., ["ollama/llama3:latest", "openai_compatible/gpt-4o"]
  model_order_list?: string[]; // User-defined order of model IDs
}

export type ModelSettingsResponse = ModelSettings;
export type ModelSettingsUpdatePayload = Partial<ModelSettings>;

// API Service Functions

export const getModels = async (source?: string): Promise<ModelResponse[]> => { // This might now include remote services configured
  const params: Record<string, string> = {};
  if (source) {
    params.source = source;
  }
  const response = await axiosInstance.get<ModelResponse[]>(ADMIN_MODELS_API_BASE_URL, { params });
  return response.data;
};

export const pullOllamaModel = async (data: ModelPullPayload): Promise<any> => {
// The backend might return a task ID for polling, or a streaming response.
  const response = await axiosInstance.post<ModelPullResponse>(`${ADMIN_MODELS_API_BASE_URL}/pull`, data);
  return response.data;
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

  // Functions for Remote Model Service Configurations
  getRemoteModelServices: async (): Promise<RemoteModelServiceConfig[]> => {
    const response = await axiosInstance.get<RemoteModelServiceConfig[]>(ADMIN_REMOTE_SERVICES_API_BASE_URL);
    return response.data;
  },
  createRemoteModelService: async (data: RemoteModelServiceCreatePayload): Promise<RemoteModelServiceConfig> => {
    const response = await axiosInstance.post<RemoteModelServiceConfig>(ADMIN_REMOTE_SERVICES_API_BASE_URL, data);
    return response.data;
  },
  updateRemoteModelService: async (serviceId: string, data: RemoteModelServiceUpdatePayload): Promise<RemoteModelServiceConfig> => {
    const response = await axiosInstance.put<RemoteModelServiceConfig>(`${ADMIN_REMOTE_SERVICES_API_BASE_URL}/${serviceId}`, data);
    return response.data;
  },
  deleteRemoteModelService: async (serviceId: string): Promise<void> => {
    await axiosInstance.delete(`${ADMIN_REMOTE_SERVICES_API_BASE_URL}/${serviceId}`);
  },
};

export default adminModelService;
