import axiosInstance from './axiosInstance'; // Assuming this is configured

// Using the V2 admin path as per the plan
const ADMIN_EXTERNAL_RAG_API_BASE_URL = '/api/v2/admin/external-rag';
// If still using V1, this would be: '/api/v1/external_rag_services';

export interface ExternalRagService {
  id: number; // Changed to number to match backend DB model (integer ID)
  name: string;
  url: string;
  api_key?: string; // Should NOT be returned by GET list/details for security. Placeholder if returned.
  has_api_key?: boolean; // Derived or sent by backend to indicate if a key is set
  created_at: string; // Assuming ISO date string from backend JSON (datetime encoded as int by default in UserResponse, check consistency)
  updated_at: string;
}

export interface ExternalRagServiceCreatePayload {
  name: string;
  url: string;
  api_key?: string;
}

export type ExternalRagServiceUpdatePayload = Partial<ExternalRagServiceCreatePayload>;

// API Service Functions

export const getExternalRagServices = async (): Promise<ExternalRagService[]> => {
  const response = await axiosInstance.get<ExternalRagService[]>(ADMIN_EXTERNAL_RAG_API_BASE_URL);
  // Map backend response if necessary, e.g., to add has_api_key if not directly provided
  return response.data.map(service => ({
    ...service,
    has_api_key: !!service.api_key // Simple check; backend should ideally send a dedicated boolean
  }));
};

export const createExternalRagService = async (data: ExternalRagServiceCreatePayload): Promise<ExternalRagService> => {
  const response = await axiosInstance.post<ExternalRagService>(ADMIN_EXTERNAL_RAG_API_BASE_URL, data);
  return response.data;
};

// getExternalRagServiceById might not be strictly needed if edit form is populated from list data directly.
// However, if detailed data (e.g. full API key for an "reveal" feature, though risky) is needed, it could be useful.
// For now, assuming list data is sufficient for edit form population (excluding API key display).
export const getExternalRagServiceById = async (id: number): Promise<ExternalRagService> => {
  const response = await axiosInstance.get<ExternalRagService>(`${ADMIN_EXTERNAL_RAG_API_BASE_URL}/${id}`);
  return response.data;
};

export const updateExternalRagService = async (id: number, data: ExternalRagServiceUpdatePayload): Promise<ExternalRagService> => {
  const response = await axiosInstance.put<ExternalRagService>(`${ADMIN_EXTERNAL_RAG_API_BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteExternalRagService = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${ADMIN_EXTERNAL_RAG_API_BASE_URL}/${id}`);
};

const adminExternalRagService = {
  getExternalRagServices,
  createExternalRagService,
  getExternalRagServiceById, // Included for completeness
  updateExternalRagService,
  deleteExternalRagService,
};

export default adminExternalRagService;
