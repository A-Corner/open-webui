import { WEBUI_API_BASE_URL } from '$lib/constants';

// Interface for the RagService object matching the backend model
export interface RagService {
  id: number;
  name: string;
  url: string;
  api_key?: string;
  created_at: string; // Assuming ISO date string
  updated_at: string; // Assuming ISO date string
}

// Interface for the Document object (simplified, matching langchain_core.documents.Document basic structure)
export interface Document {
  page_content: string;
  metadata: Record<string, any>; // Generic object for metadata
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Function to handle API requests
const handleRequest = async <T>(
  url: string,
  method: string,
  body?: any
): Promise<T> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP error ${response.status}`);
  }

  if (response.status === 204) { // No Content
    return null as T;
  }
  return response.json();
};

// API functions
export const createExternalRagService = async (
  name: string,
  url: string,
  apiKey?: string
): Promise<RagService> => {
  const payload = { name, url, api_key: apiKey };
  return handleRequest<RagService>(`${WEBUI_API_BASE_URL}/external_rag_services`, 'POST', payload);
};

export const getExternalRagServices = async (): Promise<RagService[]> => {
  return handleRequest<RagService[]>(`${WEBUI_API_BASE_URL}/external_rag_services`, 'GET');
};

export const getExternalRagServiceById = async (serviceId: string): Promise<RagService> => {
  return handleRequest<RagService>(`${WEBUI_API_BASE_URL}/external_rag_services/${serviceId}`, 'GET');
};

export const updateExternalRagService = async (
  serviceId: string,
  name?: string,
  url?: string,
  apiKey?: string
): Promise<RagService> => {
  const payload: { name?: string; url?: string; api_key?: string } = {};
  if (name !== undefined) payload.name = name;
  if (url !== undefined) payload.url = url;
  if (apiKey !== undefined) payload.api_key = apiKey;

  return handleRequest<RagService>(`${WEBUI_API_BASE_URL}/external_rag_services/${serviceId}`, 'PUT', payload);
};

export const deleteExternalRagService = async (serviceId: string): Promise<void> => {
  // The backend returns a message, but for void we expect no content or handle it appropriately
  // For now, let's assume 200/204 on success and rely on handleRequest for errors.
  await handleRequest<any>(`${WEBUI_API_BASE_URL}/external_rag_services/${serviceId}`, 'DELETE');
};

export const queryExternalRagService = async (
  serviceId: string,
  query: string
): Promise<Document[]> => {
  const payload = { query };
  return handleRequest<Document[]>(`${WEBUI_API_BASE_URL}/external_rag_services/${serviceId}/query`, 'POST', payload);
};
