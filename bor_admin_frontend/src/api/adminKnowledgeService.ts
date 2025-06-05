import axiosInstance from './axiosInstance'; // Assuming this is configured

const ADMIN_KNOWLEDGE_API_BASE_URL = '/api/v2/admin/knowledge';

// Interfaces based on backend Pydantic models for V2 Knowledge Management

export interface CollectionInfoShort { // For embedding in DocumentResponse
  id: string;
  name: string;
}

export interface DocumentResponse {
  id: string;
  name: string;
  filename: string;
  content_type: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  uploaded_at: string;
  collections?: CollectionInfoShort[]; // List of collections this document belongs to
}

export interface CollectionResponse {
  id: string;
  name: string;
  description?: string;
  document_count?: number;
  created_at: string;
  updated_at: string; // Added
  embed_config?: Record<string, any>; // Added
}

export interface CollectionDetailResponse { // For GET /collections/{collection_id}
    collection: CollectionResponse;
    documents: PaginatedDocumentsResponse;
}

export interface FileUploadResponse { // This might be same as DocumentResponse or simpler
  id: string;
  filename: string;
  message: string;
  status: 'pending' | 'processing';
  // Optionally include the full DocumentResponse if backend sends it after initial creation
  document?: DocumentResponse;
}

// Payloads for new Collection CRUD
export interface CollectionCreatePayload {
    name: string;
    description?: string;
    embed_config?: Record<string, any>;
}
export type CollectionUpdatePayload = Partial<CollectionCreatePayload>;

// Payloads for managing documents in collections
export interface AddDocumentsToCollectionPayload {
    document_ids: string[];
}
export type RemoveDocumentsFromCollectionPayload = AddDocumentsToCollectionPayload;

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
  query?: string;
  status?: string;
  collection_id?: string; // Filter by collection
}): Promise<PaginatedDocumentsResponse> => {
  const response = await axiosInstance.get<PaginatedDocumentsResponse>(
    `${ADMIN_KNOWLEDGE_API_BASE_URL}/documents`,
    { params }
  );
  return response.data;
};

export const reEmbedDocument = async (documentId: string): Promise<void> => {
  await axiosInstance.post(`${ADMIN_KNOWLEDGE_API_BASE_URL}/documents/${documentId}/re-embed`);
};

export const getCollections = async (params: {
  page?: number;
  per_page?: number;
  query?: string;
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
  reEmbedDocument, // Added
  getCollections,
  getDocumentById,
  deleteDocument,

  // Collection CRUD
  createCollection: async (data: CollectionCreatePayload): Promise<CollectionResponse> => {
    const response = await axiosInstance.post<CollectionResponse>(`${ADMIN_KNOWLEDGE_API_BASE_URL}/collections`, data);
    return response.data;
  },
  getCollectionDetail: async (collectionId: string, docParams?: { page?: number; per_page?: number }): Promise<CollectionDetailResponse> => {
    const response = await axiosInstance.get<CollectionDetailResponse>(`${ADMIN_KNOWLEDGE_API_BASE_URL}/collections/${collectionId}`, { params: docParams });
    return response.data;
  },
  updateCollection: async (collectionId: string, data: CollectionUpdatePayload): Promise<CollectionResponse> => {
    const response = await axiosInstance.put<CollectionResponse>(`${ADMIN_KNOWLEDGE_API_BASE_URL}/collections/${collectionId}`, data);
    return response.data;
  },
  deleteCollection: async (collectionId: string, deleteDocuments?: boolean): Promise<void> => {
    await axiosInstance.delete(`${ADMIN_KNOWLEDGE_API_BASE_URL}/collections/${collectionId}`, { params: { delete_documents: deleteDocuments } });
  },

  // Manage documents within a collection
  addDocumentsToCollection: async (collectionId: string, data: AddDocumentsToCollectionPayload): Promise<void> => {
    await axiosInstance.post(`${ADMIN_KNOWLEDGE_API_BASE_URL}/collections/${collectionId}/documents`, data);
  },
  removeDocumentsFromCollection: async (collectionId: string, data: RemoveDocumentsFromCollectionPayload): Promise<void> => {
    await axiosInstance.delete(`${ADMIN_KNOWLEDGE_API_BASE_URL}/collections/${collectionId}/documents`, { data });
  },

  // New collection operations
  reEmbedAllDocumentsInCollection: async (collectionId: string): Promise<void> => {
    await axiosInstance.post(`${ADMIN_KNOWLEDGE_API_BASE_URL}/collections/${collectionId}/re-embed-all-documents`);
  },
  clearCollectionEmbeddings: async (collectionId: string): Promise<void> => {
    await axiosInstance.delete(`${ADMIN_KNOWLEDGE_API_BASE_URL}/collections/${collectionId}/embeddings`);
  }
};

export default adminKnowledgeService;
