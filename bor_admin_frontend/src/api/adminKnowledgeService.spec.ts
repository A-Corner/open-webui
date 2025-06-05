import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminKnowledgeService, {
  type DocumentResponse,
  type CollectionResponse,
  type FileUploadResponse,
  type PaginatedDocumentsResponse,
  type PaginatedCollectionsResponse,
} from './adminKnowledgeService'; // Adjust path
import axiosInstance from './axiosInstance'; // We'll mock this

// Mock axiosInstance
vi.mock('./axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAxiosInstance = axiosInstance as vi.Mocked<typeof axiosInstance>;
const ADMIN_KNOWLEDGE_API_BASE_URL = '/api/v2/admin/knowledge';

describe('Admin Knowledge API Service (adminKnowledgeService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDocument: DocumentResponse = {
    id: 'doc1', name: 'Document 1', filename: 'doc1.pdf', content_type: 'application/pdf',
    size: 102400, status: 'completed', uploaded_at: new Date().toISOString(),
  };

  const mockCollection: CollectionResponse = {
    id: 'col1', name: 'Collection 1', document_count: 5, created_at: new Date().toISOString(),
  };

  describe('uploadDocument', () => {
    it('should upload a document and return file upload response', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const collectionName = 'mycollection';
      const mockResponse: FileUploadResponse = {
        id: 'doc123', filename: 'test.pdf', message: 'Uploaded', status: 'pending',
      };
      mockedAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await adminKnowledgeService.uploadDocument(file, collectionName);

      expect(mockedAxiosInstance.post).toHaveBeenCalledTimes(1);
      const callArgs = mockedAxiosInstance.post.mock.calls[0];
      expect(callArgs[0]).toBe(`${ADMIN_KNOWLEDGE_API_BASE_URL}/documents`);
      expect(callArgs[1]).toBeInstanceOf(FormData);
      expect((callArgs[1] as FormData).get('file')).toEqual(file);
      expect((callArgs[1] as FormData).get('collection_name')).toBe(collectionName);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDocuments', () => {
    it('should fetch documents with parameters and return paginated response', async () => {
      const params = { page: 1, per_page: 10, query: 'test', status: 'completed' };
      const mockResponse: PaginatedDocumentsResponse = {
        documents: [mockDocument], total: 1, page: 1, per_page: 10,
      };
      mockedAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await adminKnowledgeService.getDocuments(params);

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(`${ADMIN_KNOWLEDGE_API_BASE_URL}/documents`, { params });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCollections', () => {
    it('should fetch collections with parameters and return paginated response', async () => {
      const params = { page: 1, per_page: 10, query: 'test' };
      const mockResponse: PaginatedCollectionsResponse = {
        collections: [mockCollection], total: 1, page: 1, per_page: 10,
      };
      mockedAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await adminKnowledgeService.getCollections(params);

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(`${ADMIN_KNOWLEDGE_API_BASE_URL}/collections`, { params });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDocumentById', () => {
    it('should fetch a single document by ID', async () => {
      const documentId = 'doc1';
      mockedAxiosInstance.get.mockResolvedValue({ data: mockDocument });

      const result = await adminKnowledgeService.getDocumentById(documentId);

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(`${ADMIN_KNOWLEDGE_API_BASE_URL}/documents/${documentId}`);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('deleteDocument', () => {
    it('should send a delete request for a document', async () => {
      const documentId = 'doc1';
      mockedAxiosInstance.delete.mockResolvedValue({}); // Void response

      await adminKnowledgeService.deleteDocument(documentId);

      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith(`${ADMIN_KNOWLEDGE_API_BASE_URL}/documents/${documentId}`);
    });
  });

  it('should throw an error if an API call fails (getDocuments example)', async () => {
    const apiError = { response: { data: { detail: 'Knowledge API Error' }, status: 500 } };
    mockedAxiosInstance.get.mockRejectedValue(apiError);

    await expect(adminKnowledgeService.getDocuments({})).rejects.toEqual(apiError);
  });
});
