import { create } from 'zustand';
import adminKnowledgeService, {
  type DocumentResponse,
  type CollectionResponse,
  type FileUploadResponse,
  type PaginatedDocumentsResponse,
  type PaginatedCollectionsResponse,
  type CollectionDetailResponse,
  type CollectionCreatePayload,
  type CollectionUpdatePayload,
  type AddDocumentsToCollectionPayload,
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
  currentCollectionDetail: CollectionDetailResponse | null; // Added

  uploadingFiles: Record<string, UploadingFileState>;

  isLoadingDocuments: boolean;
  isLoadingCollections: boolean;
  isLoadingCollectionDetail: boolean; // Added
  isUpdatingCollection: boolean; // Added for CUD on collections
  isManagingCollectionDocuments: boolean; // Added for add/remove docs in collection

  errorDocuments: string | null;
  errorCollections: string | null;
  errorUpload: string | null;
  errorCollectionDetail: string | null; // Added
  errorUpdatingCollection: string | null; // Added

  fetchDocuments: (params: { page?: number; per_page?: number; query?: string; status?: string; collection_id?: string }) => Promise<void>;
  fetchCollections: (params: { page?: number; per_page?: number; query?: string }) => Promise<void>;
  uploadFile: (file: File, collectionName?: string) => Promise<FileUploadResponse | null>;
  clearUploadingFile: (fileName: string) => void;

  // Document actions
  deleteDocument: (documentId: string) => Promise<boolean>; // Changed from deleteDocumentLocal to full action
  reEmbedDocument: (documentId: string) => Promise<boolean>;

  // Collection actions
  fetchCollectionDetail: (collectionId: string, docParams?: {page?: number; per_page?: number}) => Promise<void>;
  createCollection: (payload: CollectionCreatePayload) => Promise<CollectionResponse | null>;
  updateCollection: (collectionId: string, payload: CollectionUpdatePayload) => Promise<CollectionResponse | null>;
  deleteCollection: (collectionId: string, deleteDocs?: boolean) => Promise<boolean>;
  addDocumentsToCollection: (collectionId: string, documentIds: string[]) => Promise<boolean>;
  removeDocumentsFromCollection: (collectionId: string, documentIds: string[]) => Promise<boolean>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  documents: [],
  totalDocuments: 0,
  collections: [],
  totalCollections: 0,
  uploadingFiles: {},
  isLoadingDocuments: false,
  isLoadingCollections: false,
  isLoadingCollectionDetail: false,
  isUpdatingCollection: false,
  isManagingCollectionDocuments: false,
  currentCollectionDetail: null,
  errorDocuments: null,
  errorCollections: null,
  errorUpload: null,
  errorCollectionDetail: null,
  errorUpdatingCollection: null,

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


  deleteDocument: async (documentId: string) => {
    // Could add specific loading state like isDeletingDocument: { [docId]: boolean }
    try {
      await adminKnowledgeService.deleteDocument(documentId);
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== documentId),
        totalDocuments: Math.max(0, state.totalDocuments - 1),
      }));
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to delete document.';
      set({ errorDocuments: error }); // Or a more specific errorDeleting state
      return false;
    }
  },

  reEmbedDocument: async (documentId: string) => {
    // Could add specific loading state like isReEmbeddingDocument: { [docId]: boolean }
    try {
      await adminKnowledgeService.reEmbedDocument(documentId);
      // Optionally refresh just this document's state or the whole list
      // For now, assume success means it's being re-processed; status might change.
      // A targeted fetch for this doc or a full list refresh might be good.
      // Example: Optimistically set status to 'processing' or refetch.
      get().fetchDocuments({
        page: useKnowledgeStore.getState().documents.findIndex(d => d.id === documentId) / (useKnowledgeStore.getState().documents.length / useKnowledgeStore.getState().totalDocuments) + 1 || 1, // try to stay on same page
        per_page: useKnowledgeStore.getState().documents.length / useKnowledgeStore.getState().totalDocuments || 10, // current page size
      });
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to re-embed document.';
      // Set error state for this specific document or a general one
      set(state => ({ ...state, errorDocuments: `${error} (Document ID: ${documentId})`})); // Keep general errorDocuments for now
      return false;
    }
  },

  fetchCollectionDetail: async (collectionId: string, docParams?: {page?: number; per_page?: number}) => {
    set({ isLoadingCollectionDetail: true, errorCollectionDetail: null });
    try {
      const detail = await adminKnowledgeService.getCollectionDetail(collectionId, docParams);
      set({ currentCollectionDetail: detail, isLoadingCollectionDetail: false });
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to fetch collection details.';
      set({ errorCollectionDetail: error, isLoadingCollectionDetail: false, currentCollectionDetail: null });
    }
  },

  createCollection: async (payload: CollectionCreatePayload) => {
    set({ isUpdatingCollection: true, errorUpdatingCollection: null });
    try {
      const newCollection = await adminKnowledgeService.createCollection(payload);
      set(state => ({
        collections: [...state.collections, newCollection],
        totalCollections: state.totalCollections + 1,
        isUpdatingCollection: false,
      }));
      return newCollection;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to create collection.';
      set({ errorUpdatingCollection: error, isUpdatingCollection: false });
      return null;
    }
  },

  updateCollection: async (collectionId: string, payload: CollectionUpdatePayload) => {
    set({ isUpdatingCollection: true, errorUpdatingCollection: null });
    try {
      const updatedCollection = await adminKnowledgeService.updateCollection(collectionId, payload);
      set(state => ({
        collections: state.collections.map(c => c.id === collectionId ? updatedCollection : c),
        currentCollectionDetail: state.currentCollectionDetail && state.currentCollectionDetail.collection.id === collectionId
          ? { ...state.currentCollectionDetail, collection: updatedCollection }
          : state.currentCollectionDetail,
        isUpdatingCollection: false,
      }));
      return updatedCollection;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to update collection.';
      set({ errorUpdatingCollection: error, isUpdatingCollection: false });
      return null;
    }
  },

  deleteCollection: async (collectionId: string, deleteDocs: boolean = false) => {
    set({ isUpdatingCollection: true, errorUpdatingCollection: null }); // Use general updating flag for now
    try {
      await adminKnowledgeService.deleteCollection(collectionId, deleteDocs);
      set(state => ({
        collections: state.collections.filter(c => c.id !== collectionId),
        totalCollections: Math.max(0, state.totalCollections - 1),
        currentCollectionDetail: state.currentCollectionDetail && state.currentCollectionDetail.collection.id === collectionId
          ? null
          : state.currentCollectionDetail,
        isUpdatingCollection: false,
      }));
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to delete collection.';
      set({ errorUpdatingCollection: error, isUpdatingCollection: false });
      return false;
    }
  },

  addDocumentsToCollection: async (collectionId: string, documentIds: string[]) => {
    set({ isManagingCollectionDocuments: true, errorUpdatingCollection: null }); // Use errorUpdatingCollection for now
    try {
      await adminKnowledgeService.addDocumentsToCollection(collectionId, { document_ids: documentIds });
      // Refresh collection detail or specific documents
      if (get().currentCollectionDetail?.collection.id === collectionId) {
        get().fetchCollectionDetail(collectionId); // Refresh if current detail is for this collection
      }
      get().fetchDocuments({}); // Refresh all documents as their collection list might change
      set({ isManagingCollectionDocuments: false });
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to add documents to collection.';
      set({ errorUpdatingCollection: error, isManagingCollectionDocuments: false });
      return false;
    }
  },

  removeDocumentsFromCollection: async (collectionId: string, documentIds: string[]) => {
    set({ isManagingCollectionDocuments: true, errorUpdatingCollection: null });
    try {
      await adminKnowledgeService.removeDocumentsFromCollection(collectionId, { document_ids: documentIds });
      // Refresh collection detail or specific documents
       if (get().currentCollectionDetail?.collection.id === collectionId) {
        get().fetchCollectionDetail(collectionId); // Refresh if current detail is for this collection
      }
      get().fetchDocuments({}); // Refresh all documents as their collection list might change
      set({ isManagingCollectionDocuments: false });
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to remove documents from collection.';
      set({ errorUpdatingCollection: error, isManagingCollectionDocuments: false }); // Use errorUpdatingCollection
      return false;
    }
  },

  reEmbedAllDocumentsInCollection: async (collectionId: string) => {
    set({ isUpdatingCollection: true, errorUpdatingCollection: null }); // Reuse general collection update flags
    try {
      await adminKnowledgeService.reEmbedAllDocumentsInCollection(collectionId);
      // After success, might want to refresh the collection detail or related documents if their status changes
      // For now, assume caller will handle any necessary data refresh or UI feedback.
      // Or, can update status of docs in currentCollectionDetail if that's robust.
      if (get().currentCollectionDetail?.collection.id === collectionId) {
        get().fetchCollectionDetail(collectionId); // Refresh current collection view
      }
      set({ isUpdatingCollection: false });
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to re-embed all documents in collection.';
      set({ errorUpdatingCollection: error, isUpdatingCollection: false });
      return false;
    }
  },

  clearCollectionEmbeddings: async (collectionId: string) => {
    set({ isUpdatingCollection: true, errorUpdatingCollection: null });
    try {
      await adminKnowledgeService.clearCollectionEmbeddings(collectionId);
      // Embeddings are cleared. Documents might change status or need re-embedding.
      // Refreshing collection detail might be good.
      if (get().currentCollectionDetail?.collection.id === collectionId) {
        get().fetchCollectionDetail(collectionId);
      }
      // Also, documents in the main list might need their status updated if they were part of this collection.
      // This could be complex to track client-side, a general refresh might be easier.
      get().fetchDocuments({}); // Refresh all documents as their status might implicitly change for RAG
      set({ isUpdatingCollection: false });
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to clear collection embeddings.';
      set({ errorUpdatingCollection: error, isUpdatingCollection: false });
      return false;
    }
  }
}));
