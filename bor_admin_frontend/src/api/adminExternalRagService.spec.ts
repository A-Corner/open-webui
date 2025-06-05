import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminExternalRagService, {
  type ExternalRagService,
  type ExternalRagServiceCreatePayload,
  type ExternalRagServiceUpdatePayload,
} from './adminExternalRagService'; // Adjust path
import axiosInstance from './axiosInstance'; // We'll mock this

// Mock axiosInstance
vi.mock('./axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAxiosInstance = axiosInstance as vi.Mocked<typeof axiosInstance>;
const ADMIN_EXTERNAL_RAG_API_BASE_URL = '/api/v2/admin/external-rag';

describe('Admin External RAG API Service (adminExternalRagService.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockService: ExternalRagService = {
    id: 1, name: 'Test RAG', url: 'http://test.com', api_key: '****', has_api_key: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };

  describe('getExternalRagServices', () => {
    it('should fetch and return a list of external RAG services', async () => {
      const mockResponseData = [mockService];
      // Simulate the mapping done in the service function for has_api_key
      const expectedServices = mockResponseData.map(s => ({ ...s, has_api_key: !!s.api_key }));
      mockedAxiosInstance.get.mockResolvedValue({ data: mockResponseData });

      const result = await adminExternalRagService.getExternalRagServices();

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(ADMIN_EXTERNAL_RAG_API_BASE_URL);
      expect(result).toEqual(expectedServices);
    });
  });

  describe('createExternalRagService', () => {
    it('should create an external RAG service and return it', async () => {
      const payload: ExternalRagServiceCreatePayload = { name: 'New RAG', url: 'http://new.com', api_key: 'key123' };
      mockedAxiosInstance.post.mockResolvedValue({ data: mockService }); // Assuming backend returns the created service

      const result = await adminExternalRagService.createExternalRagService(payload);

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(ADMIN_EXTERNAL_RAG_API_BASE_URL, payload);
      expect(result).toEqual(mockService);
    });
  });

  describe('getExternalRagServiceById', () => {
    it('should fetch a single external RAG service by ID', async () => {
      const serviceId = 1;
      mockedAxiosInstance.get.mockResolvedValue({ data: mockService });

      const result = await adminExternalRagService.getExternalRagServiceById(serviceId);

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith(`${ADMIN_EXTERNAL_RAG_API_BASE_URL}/${serviceId}`);
      expect(result).toEqual(mockService);
    });
  });

  describe('updateExternalRagService', () => {
    it('should update an external RAG service and return it', async () => {
      const serviceId = 1;
      const payload: ExternalRagServiceUpdatePayload = { name: 'Updated RAG Name' };
      const updatedService = { ...mockService, ...payload };
      mockedAxiosInstance.put.mockResolvedValue({ data: updatedService });

      const result = await adminExternalRagService.updateExternalRagService(serviceId, payload);

      expect(mockedAxiosInstance.put).toHaveBeenCalledWith(`${ADMIN_EXTERNAL_RAG_API_BASE_URL}/${serviceId}`, payload);
      expect(result).toEqual(updatedService);
    });
  });

  describe('deleteExternalRagService', () => {
    it('should delete an external RAG service', async () => {
      const serviceId = 1;
      mockedAxiosInstance.delete.mockResolvedValue({}); // Void response

      await adminExternalRagService.deleteExternalRagService(serviceId);

      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith(`${ADMIN_EXTERNAL_RAG_API_BASE_URL}/${serviceId}`);
    });
  });

  it('should throw an error if an API call fails', async () => {
    const apiError = { response: { data: { detail: 'RAG Service API Error' }, status: 500 } };
    mockedAxiosInstance.get.mockRejectedValue(apiError); // Test with getExternalRagServices

    await expect(adminExternalRagService.getExternalRagServices()).rejects.toEqual(apiError);
  });
});
