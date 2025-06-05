// bor_app_frontend/src/store/chatStore.spec.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useChatStore } from './chatStore';
import *_sessionService from '../api/sessionService'; // Mock getMessagesAPI
import *_modelService from '../api/modelService';   // Mock getSelectableChatModels
import *_chatService from '../api/chatService';     // Mock edit/delete messages, sendChatMessageStream
import { useSessionStore } from './sessionStore';
import type { ChatModelResponse } from '../types/models';
import type { ChatMessage } from '../types/chat';

// Mock services and other stores
vi.mock('../api/sessionService');
vi.mock('../api/modelService');
vi.mock('../api/chatService'); // sendChatMessageStream is part of default export
vi.mock('./sessionStore', () => ({
  useSessionStore: vi.fn(() => ({
    activeSessionId: 'test-session-1', // Default mock active session
    updateSessionSettings: vi.fn(),
    fetchSessions: vi.fn(), // For sendMessage -> fetchSessions call
  })),
}));

const mockedSessionService = _sessionService as any;
const mockedModelService = _modelService as any;
const mockedChatService = _chatService as any; // sendChatMessageStream is on default export
const mockedSessionStoreActions = { // Define outside if used in multiple tests
    activeSessionId: 'test-session-1',
    updateSessionSettings: vi.fn(),
    fetchSessions: vi.fn(),
};


// Helper to reset store to initial state
const resetChatStore = () => useChatStore.setState(useChatStore.getInitialState(), true);


describe('chatStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetChatStore();
    (useSessionStore as any).mockImplementation(() => mockedSessionStoreActions); // Apply mock for each test

    // Provide a default mock for sendChatMessageStream if it's part of chatService's default export
    if (mockedChatService.default && mockedChatService.default.sendChatMessageStream) {
        vi.spyOn(mockedChatService.default, 'sendChatMessageStream').mockReturnValue(new AbortController());
    } else if (mockedChatService.sendChatMessageStream) { // If it's a named export
        (mockedChatService.sendChatMessageStream as vi.Mock).mockReturnValue(new AbortController());
    } else {
        // Fallback if structure is different or to ensure it's always mocked
        mockedChatService.sendChatMessageStream = vi.fn().mockReturnValue(new AbortController());
    }

  });

  describe('Model and Temperature Settings', () => {
    it('fetchAvailableChatModels: should fetch models and update state', async () => {
      const mockModels: ChatModelResponse[] = [{ id: 'm1', name: 'Model 1', provider: 'ollama' }];
      (mockedModelService.getSelectableChatModels as vi.Mock).mockResolvedValue(mockModels);

      await useChatStore.getState().fetchAvailableChatModels();

      expect(useChatStore.getState().availableModels).toEqual(mockModels);
      expect(useChatStore.getState().isLoadingModels).toBe(false);
    });

    it('setSelectedModelId: should update selectedModelId and call sessionStore.updateSessionSettings', () => {
      useChatStore.getState().setSelectedModelId('new-model-id');
      expect(useChatStore.getState().selectedModelId).toBe('new-model-id');
      expect(mockedSessionStoreActions.updateSessionSettings).toHaveBeenCalledWith('test-session-1', { selectedModelId: 'new-model-id' });
    });

    it('setCurrentTemperature: should update currentTemperature and call sessionStore.updateSessionSettings', () => {
      useChatStore.getState().setCurrentTemperature(0.9);
      expect(useChatStore.getState().currentTemperature).toBe(0.9);
      expect(mockedSessionStoreActions.updateSessionSettings).toHaveBeenCalledWith('test-session-1', { temperature: 0.9 });
    });
  });

  describe('loadMessagesForSession', () => {
    it('should load messages for a session and reset state if sessionId is null', async () => {
      const mockMessages: ChatMessage[] = [{ id: 'msg1', sender: 'user', content: 'Hi', timestamp: Date.now() }];
      (mockedSessionService.getMessagesAPI as vi.Mock).mockResolvedValue(mockMessages);

      await useChatStore.getState().loadMessagesForSession('s1');
      expect(useChatStore.getState().messages).toEqual(mockMessages);
      expect(useChatStore.getState().isLoadingMessages).toBe(false);

      await useChatStore.getState().loadMessagesForSession(null);
      expect(useChatStore.getState().messages).toEqual([]);
      // Check if other relevant parts of state are reset to initial
      expect(useChatStore.getState().selectedModelId).toBeNull(); // Assuming initial is null
      expect(useChatStore.getState().currentTemperature).toBe(0.7); // Assuming initial is 0.7
    });
  });

  describe('sendMessage', () => {
    it('should use selectedModelId and currentTemperature from store in options', async () => {
      useChatStore.setState({ selectedModelId: 'model-from-store', currentTemperature: 0.2 });

      await useChatStore.getState().sendMessage('Hello', { knowledge_id: 'kn1' });

      const sendStreamMock = mockedChatService.sendChatMessageStream || mockedChatService.default.sendChatMessageStream;
      expect(sendStreamMock).toHaveBeenCalledWith(
        expect.any(Array), // history
        'Hello',           // userInput
        expect.any(Object), // callbacks
        expect.objectContaining({
          model: 'model-from-store',
          temperature: 0.2,
          knowledge_id: 'kn1',
        })
      );
      expect(mockedSessionStoreActions.fetchSessions).toHaveBeenCalled(); // Called onComplete
    });
  });

  describe('Message Editing and Deletion', () => {
    const initialMessages: ChatMessage[] = [
      { id: 'msg1', sender: 'user', content: 'Editable message', timestamp: Date.now() },
      { id: 'msg2', sender: 'assistant', content: 'Assistant reply', timestamp: Date.now() + 100 },
    ];

    beforeEach(() => {
      useChatStore.setState({ messages: initialMessages });
    });

    it('startEditMessage: should set editingMessageId and editingMessageContent', () => {
      useChatStore.getState().startEditMessage('msg1', 'Editable message');
      expect(useChatStore.getState().editingMessageId).toBe('msg1');
      expect(useChatStore.getState().editingMessageContent).toBe('Editable message');
    });

    it('cancelEditMessage: should clear editing state', () => {
      useChatStore.setState({ editingMessageId: 'msg1', editingMessageContent: ' कुछ ' });
      useChatStore.getState().cancelEditMessage();
      expect(useChatStore.getState().editingMessageId).toBeNull();
      expect(useChatStore.getState().editingMessageContent).toBe('');
    });

    it('submitEditMessage: should call API, update message optimistically, and clear editing state', async () => {
      useChatStore.setState({ editingMessageId: 'msg1', editingMessageContent: 'Old content' });
      const updatedMessage: ChatMessage = { ...initialMessages[0], content: 'Updated content', timestamp: Date.now() };
      (mockedChatService.editChatMessage as vi.Mock).mockResolvedValue(updatedMessage); // editChatMessage is now a named export

      await useChatStore.getState().submitEditMessage('Updated content');

      expect(mockedChatService.editChatMessage).toHaveBeenCalledWith('test-session-1', 'msg1', 'Updated content');
      const msgInStore = useChatStore.getState().messages.find(m => m.id === 'msg1');
      expect(msgInStore?.content).toBe('Updated content');
      expect(useChatStore.getState().editingMessageId).toBeNull();
      expect(mockedSessionStoreActions.fetchSessions).toHaveBeenCalled();
    });

    it('submitEditMessage: should rollback on API error', async () => {
        useChatStore.setState({ editingMessageId: 'msg1', editingMessageContent: 'Old content', messages: initialMessages });
        (mockedChatService.editChatMessage as vi.Mock).mockRejectedValue(new Error("Edit failed"));

        await useChatStore.getState().submitEditMessage('This should fail');

        const msgInStore = useChatStore.getState().messages.find(m => m.id === 'msg1');
        expect(msgInStore?.content).toBe('Editable message'); // Rolled back to original
        expect(useChatStore.getState().error).toBe('Edit failed');
      });

    it('removeMessage: should call API and remove message optimistically', async () => {
      (mockedChatService.deleteChatMessage as vi.Mock).mockResolvedValue(undefined); // deleteChatMessage is now a named export

      await useChatStore.getState().removeMessage('msg1');

      expect(mockedChatService.deleteChatMessage).toHaveBeenCalledWith('test-session-1', 'msg1');
      expect(useChatStore.getState().messages.find(m => m.id === 'msg1')).toBeUndefined();
      expect(useChatStore.getState().messages.length).toBe(1);
      expect(mockedSessionStoreActions.fetchSessions).toHaveBeenCalled();
    });

    it('removeMessage: should rollback on API error', async () => {
        (mockedChatService.deleteChatMessage as vi.Mock).mockRejectedValue(new Error("Delete failed"));

        await useChatStore.getState().removeMessage('msg1');
        expect(useChatStore.getState().messages.length).toBe(2); // Message still there
        expect(useChatStore.getState().error).toBe("Delete failed");
    });
  });
});
