import { create } from 'zustand';
import adminKnowledgeService, {
  type DocumentResponse,
  type CollectionResponse,
  type FileUploadResponse,
  type PaginatedDocumentsResponse,
  type PaginatedCollectionsResponse,
} from '../api/adminKnowledgeService'; // Adjust path

interface UploadingFileState {
  progress?: number; // For future use if progress tracking is added
  status: 'uploading' | 'error' | 'success' | 'pending'; // 'pending' before API call, 'uploading' during
  error?: string;
  id?: string; // Document ID received after successful upload and backend processing start
}

interface KnowledgeState {
  documents: DocumentResponse[];
  totalDocuments: number;
  collections: CollectionResponse[];
  totalCollections: number;

  uploadingFiles: Record<string, UploadingFileState>; // Keyed by original filename or a temp ID

  isLoadingDocuments: boolean;
  isLoadingCollections: boolean;
  errorDocuments: string | null;
  errorCollections: string | null;
  errorUpload: string | null; // General upload error

  fetchDocuments: (params: { page?: number; per_page?: number; query?: string; status?: string }) => Promise<void>;
  fetchCollections: (params: { page?: number; per_page?: number; query?: string }) => Promise<void>;
  uploadFile: (file: File, collectionName?: string) => Promise<FileUploadResponse | null>;
  clearUploadingFile: (fileName: string) => void;
  deleteDocumentLocal: (documentId: string) => Promise<void>; // Optimistic delete from store
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  documents: [],
  totalDocuments: 0,
  collections: [],
  totalCollections: 0,
  uploadingFiles: {},
  isLoadingDocuments: false,
  isLoadingCollections: false,
  errorDocuments: null,
  errorCollections: null,
  errorUpload: null,

  fetchDocuments: async (params) => {
    set({ isLoadingDocuments: true, errorDocuments: null });
    try {
      const response = await adminKnowledgeService.getDocuments(params);
      set({
        documents: response.documents,
        totalDocuments: response.total,
        isLoadingDocuments: false,
      });
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to fetch documents.';
      set({ errorDocuments: error, isLoadingDocuments: false, documents: [], totalDocuments: 0 });
    }
  },

  fetchCollections: async (params) => {
    set({ isLoadingCollections: true, errorCollections: null });
    try {
      const response = await adminKnowledgeService.getCollections(params);
      set({
        collections: response.collections,
        totalCollections: response.total,
        isLoadingCollections: false,
      });
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to fetch collections.';
      set({ errorCollections: error, isLoadingCollections: false, collections: [], totalCollections: 0 });
    }
  },

  uploadFile: async (file: File, collectionName?: string) => {
    const tempFileKey = `${file.name}-${file.lastModified}`; // Create a somewhat unique key for tracking
    set(state => ({
      uploadingFiles: {
        ...state.uploadingFiles,
        [tempFileKey]: { status: 'uploading', progress: 0 },
      },
      errorUpload: null,
    }));

    try {
      const response = await adminKnowledgeService.uploadDocument(file, collectionName);
      set(state => ({
        uploadingFiles: {
          ...state.uploadingFiles,
          [tempFileKey]: { status: 'success', id: response.id, progress: 100 },
        },
      }));
      // Optionally, refresh documents list after successful upload
      // get().fetchDocuments({ page: 1, per_page: 10 }); // Consider current page/filters
      return response;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || `Failed to upload ${file.name}.`;
      set(state => ({
        uploadingFiles: {
          ...state.uploadingFiles,
          [tempFileKey]: { status: 'error', error: error },
        },
        errorUpload: error, // Can also set a general upload error
      }));
      return null;
    }
  },

  clearUploadingFile: (fileName: string) => {
    set(state => {
      const newUploadingFiles = { ...state.uploadingFiles };
      const tempFileKey = Object.keys(newUploadingFiles).find(k => k.startsWith(fileName + "-"));
      if (tempFileKey && (newUploadingFiles[tempFileKey].status === 'success' || newUploadingFiles[tempFileKey].status === 'error')) {
        delete newUploadingFiles[tempFileKey];
      }
      return { uploadingFiles: newUploadingFiles };
    });
  },

  // Example of optimistic update for delete, full implementation requires backend call
  deleteDocumentLocal: async (documentId: string) => {
    // This would be part of a full deleteDocument action that calls the API
    // For now, just showing optimistic UI update.
    set(state => ({
      documents: state.documents.filter(doc => doc.id !== documentId),
      totalDocuments: Math.max(0, state.totalDocuments -1),
    }));
    // In a full action:
    // try {
    //   await adminKnowledgeService.deleteDocument(documentId);
    // } catch (err) {
    //   // Revert optimistic update, show error
    //   get().fetchDocuments(...); // or add back the document
    // }
  }
}));
