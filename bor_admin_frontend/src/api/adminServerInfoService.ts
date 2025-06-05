import axiosInstance from './axiosInstance'; // Assuming this is configured

const ADMIN_SERVER_INFO_API_BASE_URL = '/api/v2/admin/server-info';

export interface ServerInfoResponse {
  app_version: string;
  python_version: string;
  fastapi_version?: string; // Optional as it might not always be available/needed
  langchain_version?: string; // Optional
  // cpu_load_avg?: number[]; // Example: [0.1, 0.15, 0.1] for 1, 5, 15 min
  // memory_usage?: { total_gb: number; used_gb: number; percent: number };
  // Other relevant versions or basic stats
}

export const getServerInfo = async (): Promise<ServerInfoResponse> => {
  const response = await axiosInstance.get<ServerInfoResponse>(ADMIN_SERVER_INFO_API_BASE_URL);
  return response.data;
};

const adminServerInfoService = {
  getServerInfo,
};

export default adminServerInfoService;
