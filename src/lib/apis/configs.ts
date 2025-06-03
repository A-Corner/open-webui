import { WEBUI_API_BASE_URL } from '$lib/constants';
import type { PromptSuggestion } from '$lib/types'; // Assuming PromptSuggestion type might exist globally

// Interfaces for configuration categories based on backend Pydantic models

export interface UIConfig {
  ENABLE_SIGNUP: boolean;
  DEFAULT_MODELS: string[] | null; // Backend sends null for empty, frontend might prefer empty array
  WEBUI_URL: string;
  DEFAULT_LOCALE: string;
  ENABLE_COMMUNITY_SHARING: boolean;
  ENABLE_MESSAGE_RATING: boolean;
  DEFAULT_PROMPT_SUGGESTIONS: PromptSuggestion[];
}

export interface AuthConfig {
  JWT_EXPIRES_IN: string;
  ENABLE_OAUTH_SIGNUP: boolean;
  ENABLE_API_KEY: boolean;
  DEFAULT_USER_ROLE: string;
}

export interface RAGConfig {
  RAG_TEMPLATE: string;
  CHUNK_SIZE: number;
  CHUNK_OVERLAP: number;
  RAG_TOP_K: number;
  RAG_RELEVANCE_THRESHOLD: number;
  ENABLE_WEB_SEARCH: boolean;
  WEB_SEARCH_ENGINE: string;
  WEB_SEARCH_RESULT_COUNT: number;
  PDF_EXTRACT_IMAGES: boolean;
}

// Helper to get auth token (assuming it exists, similar to external_rag.ts)
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Generic request handler (can be refactored into a shared utility if not already)
const handleConfigRequest = async <T, U = Partial<T>>(
  endpoint: string,
  method: 'GET' | 'PUT',
  body?: U
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
    headers
  };

  if (method === 'PUT' && body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${WEBUI_API_BASE_URL}/configs${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP error ${response.status}`);
  }
  return response.json();
};

// UI Configs
export const getUIConfigs = (): Promise<UIConfig> => {
  return handleConfigRequest<UIConfig>('/ui', 'GET');
};

export const updateUIConfigs = (config: Partial<UIConfig>): Promise<UIConfig> => {
  return handleConfigRequest<UIConfig, Partial<UIConfig>>('/ui', 'PUT', config);
};

// Auth Configs
export const getAuthConfigs = (): Promise<AuthConfig> => {
  return handleConfigRequest<AuthConfig>('/auth', 'GET');
};

export const updateAuthConfigs = (config: Partial<AuthConfig>): Promise<AuthConfig> => {
  return handleConfigRequest<AuthConfig, Partial<AuthConfig>>('/auth', 'PUT', config);
};

// RAG Configs
export const getRAGConfigs = (): Promise<RAGConfig> => {
  return handleConfigRequest<RAGConfig>('/rag', 'GET');
};

export const updateRAGConfigs = (config: Partial<RAGConfig>): Promise<RAGConfig> => {
  return handleConfigRequest<RAGConfig, Partial<RAGConfig>>('/rag', 'PUT', config);
};

// Example of how DEFAULT_MODELS (string[] | null) might be handled if backend sends string but expects array
// For DEFAULT_MODELS, if it's stored as a comma-separated string in the DB by PersistentConfig
// but your UI wants to treat it as an array:
// Getter might transform: DEFAULT_MODELS: data.DEFAULT_MODELS ? data.DEFAULT_MODELS.split(',') : []
// Setter might transform: DEFAULT_MODELS: config.DEFAULT_MODELS ? config.DEFAULT_MODELS.join(',') : null
// However, the current backend Pydantic models expect List[str] for DEFAULT_MODELS,
// and PersistentConfig's type casting should handle it if the input is a list.
// The main concern is if the Pydantic model for update expects a string for a list field.
// Based on current setup, backend expects a list directly for DEFAULT_MODELS in UIConfigUpdateForm.
// String to List conversion, if any, would be inside the PersistentConfig save logic if its env_value was a string.
// For now, assuming direct type match or backend handles conversion.
// DEFAULT_PROMPT_SUGGESTIONS is List[Any] on backend, frontend can define a more specific PromptSuggestion type.
// The PromptSuggestion type is imported assuming it's defined elsewhere (e.g., $lib/types.ts)
// If not, it should be:
// export interface PromptSuggestion { title: string[]; content: string; }
// For simplicity, if PromptSuggestion is not globally defined, I'll use any[] for now.
// The backend UIConfigResponse model has DEFAULT_PROMPT_SUGGESTIONS: List[Any].
// The UIConfig interface here has DEFAULT_PROMPT_SUGGESTIONS: PromptSuggestion[];
// This implies that the 'Any' from backend should conform to 'PromptSuggestion'.
// A more robust approach would be to validate/map this upon fetching if there's a mismatch risk.
