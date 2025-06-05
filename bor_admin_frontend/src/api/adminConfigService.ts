import axiosInstance from './axiosInstance'; // Assuming this is configured

const ADMIN_SYSTEM_CONFIGS_API_BASE_URL = '/api/v2/admin/system-configs';

export type ConfigValue = string | number | boolean | string[] | Record<string, any> | null;

export interface ConfigItem {
  key: string; // e.g., "ui.enable_signup", "ollama.base_urls"
  value: ConfigValue;
}

export interface ConfigUpdateRequest {
  configs: ConfigItem[];
}

export interface ConfigResponse {
  configs: Record<string, ConfigValue>;
  // Potential future additions:
  // metadata?: Record<string, { type: string; label: string; description?: string; group?: string; readonly?: boolean }>;
}

// API Service Functions

export const getSystemConfigs = async (): Promise<ConfigResponse> => {
  const response = await axiosInstance.get<ConfigResponse>(ADMIN_SYSTEM_CONFIGS_API_BASE_URL);
  return response.data;
};

export const updateSystemConfigs = async (data: ConfigUpdateRequest): Promise<ConfigResponse> => {
  const response = await axiosInstance.put<ConfigResponse>(ADMIN_SYSTEM_CONFIGS_API_BASE_URL, data);
  return response.data;
};

const adminConfigService = {
  getSystemConfigs,
  updateSystemConfigs,
};

export default adminConfigService;
