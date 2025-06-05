import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKnowledgeStore } from './knowledgeStore'; // Adjust path
import adminKnowledgeService, {
  type DocumentResponse,
  type CollectionResponse,
  type FileUploadResponse,
  type PaginatedDocumentsResponse,
  type PaginatedCollectionsResponse,
} from '../api/adminKnowledgeService'; // Adjust path

// Mock adminKnowledgeService
vi.mock('../api/adminKnowledgeService');

const mockAdminKnowledgeService = adminKnowledgeService as vi.Mocked<typeof adminKnowledgeService>;

describe('Knowledge Store (useKnowledgeStore)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useKnowledgeStore.setState({
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
    });
  });

  const mockDoc1: DocumentResponse = { id: 'doc1', name: 'Doc 1', filename: 'doc1.pdf', content_type: 'application/pdf', size: 100, status: 'completed', uploaded_at: new Date().toISOString() };
  const mockColl1: CollectionResponse = { id: 'col1', name: 'Collection 1', document_count: 1, created_at: new Date().toISOString() };

  describe('fetchDocuments action', () => {
    it('should fetch documents and update store on success', async () => {
      const response: PaginatedDocumentsResponse = { documents: [mockDoc1], total: 1, page: 1, per_page: 10 };
      mockAdminKnowledgeService.getDocuments.mockResolvedValue(response);
      await useKnowledgeStore.getState().fetchDocuments({ page: 1, per_page: 10 });
      expect(mockAdminKnowledgeService.getDocuments).toHaveBeenCalledWith({ page: 1, per_page: 10 });
      expect(useKnowledgeStore.getState().documents).toEqual([mockDoc1]);
      expect(useKnowledgeStore.getState().totalDocuments).toBe(1);
      expect(useKnowledgeStore.getState().isLoadingDocuments).toBe(false);
    });
    it('should set error state if fetching documents fails', async () => {
      mockAdminKnowledgeService.getDocuments.mockRejectedValue(new Error('Fetch error'));
      await useKnowledgeStore.getState().fetchDocuments({});
      expect(useKnowledgeStore.getState().errorDocuments).toContain('Fetch error');
      expect(useKnowledgeStore.getState().isLoadingDocuments).toBe(false);
    });
  });

  describe('fetchCollections action', () => {
    it('should fetch collections and update store on success', async () => {
      const response: PaginatedCollectionsResponse = { collections: [mockColl1], total: 1, page: 1, per_page: 10 };
      mockAdminKnowledgeService.getCollections.mockResolvedValue(response);
      await useKnowledgeStore.getState().fetchCollections({ page: 1, per_page: 10 });
      expect(mockAdminKnowledgeService.getCollections).toHaveBeenCalledWith({ page: 1, per_page: 10 });
      expect(useKnowledgeStore.getState().collections).toEqual([mockColl1]);
      expect(useKnowledgeStore.getState().totalCollections).toBe(1);
      expect(useKnowledgeStore.getState().isLoadingCollections).toBe(false);
    });
    it('should set error state if fetching collections fails', async () => {
      mockAdminKnowledgeService.getCollections.mockRejectedValue(new Error('Fetch error'));
      await useKnowledgeStore.getState().fetchCollections({});
      expect(useKnowledgeStore.getState().errorCollections).toContain('Fetch error');
      expect(useKnowledgeStore.getState().isLoadingCollections).toBe(false);
    });
  });

  describe('uploadFile action', () => {
    const mockFile = new File(['content'], 'testfile.pdf', { type: 'application/pdf', lastModified: Date.now() });
    const tempFileKey = `${mockFile.name}-${mockFile.lastModified}`;

    it('should update uploadingFiles state and return response on success', async () => {
      const mockUploadResponse: FileUploadResponse = { id: 'newdoc1', filename: mockFile.name, message: 'Uploaded', status: 'pending' };
      mockAdminKnowledgeService.uploadDocument.mockResolvedValue(mockUploadResponse);

      const result = await useKnowledgeStore.getState().uploadFile(mockFile, 'testcollection');

      expect(mockAdminKnowledgeService.uploadDocument).toHaveBeenCalledWith(mockFile, 'testcollection');
      const finalState = useKnowledgeStore.getState().uploadingFiles[tempFileKey];
      expect(finalState.status).toBe('success');
      expect(finalState.id).toBe('newdoc1');
      expect(result).toEqual(mockUploadResponse);
    });

    it('should update uploadingFiles state with error on failure', async () => {
      mockAdminKnowledgeService.uploadDocument.mockRejectedValue(new Error('Upload failed'));

      const result = await useKnowledgeStore.getState().uploadFile(mockFile);

      const finalState = useKnowledgeStore.getState().uploadingFiles[tempFileKey];
      expect(finalState.status).toBe('error');
      expect(finalState.error).toContain('Upload failed');
      expect(result).toBeNull();
    });
  });

  describe('clearUploadingFile action', () => {
    it('should remove a completed or errored file from uploadingFiles', () => {
      const mockFile = new File(['content'], 'filetoclear.txt', { type: 'text/plain', lastModified: Date.now()});
      const tempFileKey = `${mockFile.name}-${mockFile.lastModified}`;

      useKnowledgeStore.setState({ uploadingFiles: { [tempFileKey]: { status: 'success', id: 'doc123' } } });
      useKnowledgeStore.getState().clearUploadingFile(mockFile.name);
      expect(useKnowledgeStore.getState().uploadingFiles[tempFileKey]).toBeUndefined();

      useKnowledgeStore.setState({ uploadingFiles: { [tempFileKey]: { status: 'error', error: 'failed' } } });
      useKnowledgeStore.getState().clearUploadingFile(mockFile.name);
      expect(useKnowledgeStore.getState().uploadingFiles[tempFileKey]).toBeUndefined();
    });

    it('should not remove an uploading file from uploadingFiles', () => {
      const mockFile = new File(['content'], 'fileUploading.txt', { type: 'text/plain', lastModified: Date.now()});
      const tempFileKey = `${mockFile.name}-${mockFile.lastModified}`;

      useKnowledgeStore.setState({ uploadingFiles: { [tempFileKey]: { status: 'uploading', progress: 50 } } });
      useKnowledgeStore.getState().clearUploadingFile(mockFile.name);
      expect(useKnowledgeStore.getState().uploadingFiles[tempFileKey]).toBeDefined();
    });
  });

  describe('deleteDocumentLocal action (optimistic delete)', () => {
    it('should remove document from local store', () => {
      useKnowledgeStore.setState({ documents: [mockDoc1, { ...mockDoc1, id: 'doc2' }], totalDocuments: 2 });
      useKnowledgeStore.getState().deleteDocumentLocal('doc1');
      const { documents, totalDocuments } = useKnowledgeStore.getState();
      expect(documents.length).toBe(1);
      expect(documents[0].id).toBe('doc2');
      expect(totalDocuments).toBe(1);
    });
  });
});
