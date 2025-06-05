// bor_app_frontend/src/api/sessionService.spec.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { appAxiosInstance } from './axiosInstance';
import {
  getSessions,
  createNewSessionAPI,
  deleteSessionAPI,
  getMessagesAPI
} from './sessionService';
import type { RawSessionListItem, RawSessionDetail, Session } from '../types/session';
import type { ChatMessage } from '../types/chat';

// Mock appAxiosInstance
vi.mock('./axiosInstance', () => ({
  appAxiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedAxios = appAxiosInstance as any; // Type assertion for mocked methods

describe('sessionService', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Clear mocks before each test
  });

  describe('getSessions', () => {
    it('should fetch and map sessions correctly', async () => {
      const rawSessions: RawSessionListItem[] = [
        { id: '1', title: 'Session 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: 'user1' },
        { id: '2', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: 'user1' }, // No title
      ];
      mockedAxios.get.mockResolvedValue({ data: rawSessions });

      const result = await getSessions();

      expect(mockedAxios.get).toHaveBeenCalledWith('/chats');
      expect(result.length).toBe(2);
      expect(result[0].title).toBe('Session 1');
      expect(result[1].title).toMatch(/会话 2.{3}.../); // Default title format
      expect(result[0].createdAt).toBeTypeOf('number');
    });

    it('should throw an error if API fails', async () => {
      mockedAxios.get.mockRejectedValue({ response: { data: { detail: 'API Error' } } });
      await expect(getSessions()).rejects.toThrow('API Error');
    });
  });

  describe('createNewSessionAPI', () => {
    it('should create a new session and map the response', async () => {
      const rawSession: RawSessionListItem = { id: 'new1', title: 'New Session', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: 'user1' };
      mockedAxios.post.mockResolvedValue({ data: rawSession });

      const result = await createNewSessionAPI('New Session');

      expect(mockedAxios.post).toHaveBeenCalledWith('/chats', { title: 'New Session' });
      expect(result.id).toBe('new1');
      expect(result.title).toBe('New Session');
    });

    it('should create a new session without a title', async () => {
        const rawSession: RawSessionListItem = { id: 'new2', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: 'user1' };
        mockedAxios.post.mockResolvedValue({ data: rawSession });

        const result = await createNewSessionAPI();

        expect(mockedAxios.post).toHaveBeenCalledWith('/chats', {});
        expect(result.id).toBe('new2');
        expect(result.title).toMatch(/会话 new2.{3}.../);
      });

    it('should throw an error if API fails', async () => {
      mockedAxios.post.mockRejectedValue({ response: { data: { detail: 'Creation Failed' } } });
      await expect(createNewSessionAPI('Test')).rejects.toThrow('Creation Failed');
    });
  });

  describe('deleteSessionAPI', () => {
    it('should call delete API for the given session ID', async () => {
      mockedAxios.delete.mockResolvedValue({});
      await deleteSessionAPI('session-id-to-delete');
      expect(mockedAxios.delete).toHaveBeenCalledWith('/chats/session-id-to-delete');
    });

    it('should throw an error if API fails', async () => {
      mockedAxios.delete.mockRejectedValue({ response: { data: { detail: 'Deletion Failed' } } });
      await expect(deleteSessionAPI('id1')).rejects.toThrow('Deletion Failed');
    });
  });

  describe('getMessagesAPI', () => {
    it('should fetch, map, and sort messages correctly if messages are in "messages" property', async () => {
      const rawDetail: { messages: any[] } = { // Simulate one of the expected structures
        messages: [
          { id: 'm2', role: 'assistant', content: 'Hello there', created_at: new Date(Date.now() + 1000).toISOString() },
          { id: 'm1', role: 'user', content: 'Hi', created_at: new Date().toISOString() },
        ]
      };
      mockedAxios.get.mockResolvedValue({ data: rawDetail });

      const result = await getMessagesAPI('s1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/chats/s1');
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('m1'); // Sorted by timestamp
      expect(result[1].sender).toBe('assistant');
      expect(result[0].content).toBe('Hi');
    });

    it('should fetch, map, and sort messages correctly if data is RawSessionDetail', async () => {
        const rawDetail: RawSessionDetail = {
          id: 's1', user_id: 'u1', created_at: 'date', updated_at: 'date', // other RawSessionListItem fields
          messages: [
            { id: 'm2', sender: 'assistant', content: 'Hello there', timestamp: Date.now() + 1000, isLoading: false }, // Already ChatMessage like
            { id: 'm1', sender: 'user', content: 'Hi', timestamp: Date.now(), isLoading: false },
          ]
        };
        // For mapRawMessageToChatMessage, ensure created_at or timestamp is present in raw messages
        const rawBackendMessages = [
            { id: 'msg2', role: 'assistant', content: 'Second message', created_at: new Date(Date.now() + 1000).toISOString() },
            { id: 'msg1', role: 'user', content: 'First message', timestamp: Date.now() }, // Using timestamp directly
        ];
        const backendResponse: RawSessionDetail = {
            id: 's1', user_id: 'u1', title: 'Test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            messages: rawBackendMessages as any, // Cast if structure slightly differs from ChatMessage
        };

        mockedAxios.get.mockResolvedValue({ data: backendResponse });

        const result = await getMessagesAPI('s1');

        expect(mockedAxios.get).toHaveBeenCalledWith('/chats/s1');
        expect(result.length).toBe(2);
        expect(result[0].id).toBe('msg1'); // Sorted
        expect(result[1].sender).toBe('assistant');
      });


    it('should handle empty messages array', async () => {
      const rawDetail: RawSessionDetail = { id: 's2', user_id:'u1', title: 'Empty', created_at: 'd', updated_at: 'd', messages: [] };
      mockedAxios.get.mockResolvedValue({ data: rawDetail });
      const result = await getMessagesAPI('s2');
      expect(result.length).toBe(0);
    });

    it('should throw an error if API fails', async () => {
      mockedAxios.get.mockRejectedValue({ response: { data: { detail: 'Fetch Messages Failed' } } });
      await expect(getMessagesAPI('s3')).rejects.toThrow('Fetch Messages Failed');
    });
  });
});
