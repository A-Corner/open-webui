import axiosInstance from './axiosInstance'; // Assuming this is configured

const ADMIN_KNOWLEDGE_API_BASE_URL = '/api/v2/admin/knowledge';

// Interfaces based on backend Pydantic models for V2 Knowledge Management

export interface DocumentResponse {
  id: string;
  name: string; // Usually the filename or a title given during upload
  filename: string; // Original filename
  content_type: string;
  size: number; // File size in bytes
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  uploaded_at: string; // ISO date string
  collection_ids?: string[]; // IDs of collections this document belongs to
}

export interface CollectionResponse {
  id: string;
  name: string;
  description?: string;
  document_count?: number;
  created_at: string; // ISO date string
}

export interface FileUploadResponse {
  id: string; // Document ID created on the backend
  filename: string;
  message: string; // e.g., "File uploaded successfully, processing initiated"
  status: 'pending' | 'processing'; // Initial status after upload
}

export interface PaginatedDocumentsResponse {
  documents: DocumentResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface PaginatedCollectionsResponse {
  collections: CollectionResponse[];
  total: number;
  page: number;
  per_page: number;
}


// API Service Functions

export const uploadDocument = async (
  file: File,
  collectionName?: string // Optional: if backend supports assigning to collection during upload
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file); // Backend `UploadFile` will use this key
  if (collectionName) {
    formData.append('collection_name', collectionName); // Or 'collection_id'
  }

  // When sending FormData, Axios typically sets the Content-Type header automatically.
  // Do not manually set 'Content-Type': 'multipart/form-data' as Axios handles it with boundary.
  const response = await axiosInstance.post<FileUploadResponse>(
    `${ADMIN_KNOWLEDGE_API_BASE_URL}/documents`,
    formData
  );
  return response.data;
};

export const getDocuments = async (params: {
  page?: number;
  per_page?: number;
  query?: string; // Search by name/filename
  status?: string; // Filter by status
}): Promise<PaginatedDocumentsResponse> => {
  const response = await axiosInstance.get<PaginatedDocumentsResponse>(
    `${ADMIN_KNOWLEDGE_API_BASE_URL}/documents`,
    { params }
  );
  return response.data;
};

export const getCollections = async (params: {
  page?: number;
  per_page?: number;
  query?: string; // Search by name
}): Promise<PaginatedCollectionsResponse> => {
  const response = await axiosInstance.get<PaginatedCollectionsResponse>(
    `${ADMIN_KNOWLEDGE_API_BASE_URL}/collections`,
    { params }
  );
  return response.data;
};

// Optional but recommended functions (implement if backend supports them)
export const getDocumentById = async (documentId: string): Promise<DocumentResponse> => {
  const response = await axiosInstance.get<DocumentResponse>(
    `${ADMIN_KNOWLEDGE_API_BASE_URL}/documents/${documentId}`
  );
  return response.data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await axiosInstance.delete(`${ADMIN_KNOWLEDGE_API_BASE_URL}/documents/${documentId}`);
};


const adminKnowledgeService = {
  uploadDocument,
  getDocuments,
  getCollections,
  getDocumentById, // Included for completeness
  deleteDocument,   // Included for completeness
};

export default adminKnowledgeService;
