// bor_app_frontend/src/store/sessionStore.spec.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSessionStore } from './sessionStore';
import * as sessionService from '../api/sessionService'; // Mock entire module
import { useChatStore } from './chatStore';
import type { Session } from '../types/session';

// Mock services and other stores
vi.mock('../api/sessionService');
vi.mock('./chatStore', () => ({
  useChatStore: vi.fn(() => ({ // Provide a default mock implementation
    loadMessagesForSession: vi.fn(),
    setSelectedModelId: vi.fn(),
    setCurrentTemperature: vi.fn(),
  })),
}));


// Helper to reset store to initial state
const resetSessionStore = () => useSessionStore.setState(useSessionStore.getInitialState(), true);

describe('sessionStore', () => {
  let mockedChatStoreActions: any;

  beforeEach(() => {
    // Reset mocks and store state before each test
    vi.resetAllMocks();
    resetSessionStore(); // Resets the store to its initial state defined inside create()

    // Setup mock implementations for chatStore actions for this test suite
    mockedChatStoreActions = {
      loadMessagesForSession: vi.fn(),
      setSelectedModelId: vi.fn(),
      setCurrentTemperature: vi.fn(),
    };
    (useChatStore as any).mockImplementation(() => mockedChatStoreActions);

    // Mock localStorage for persist middleware
    Storage.prototype.getItem = vi.fn();
    Storage.prototype.setItem = vi.fn();
    Storage.prototype.removeItem = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore original implementations after each test
  });

  describe('fetchSessions', () => {
    it('should fetch sessions, update state, and set active session if list is not empty', async () => {
      const mockSessions: Session[] = [
        { id: 's1', title: 'S1', createdAt: Date.now(), updatedAt: Date.now(), selectedModelId: 'm1', temperature: 0.5 },
        { id: 's2', title: 'S2', createdAt: Date.now() - 1000, updatedAt: Date.now() - 1000 }, // no model/temp
      ];
      (sessionService.getSessions as vi.Mock).mockResolvedValue(mockSessions);

      await useSessionStore.getState().fetchSessions();

      expect(sessionService.getSessions).toHaveBeenCalledTimes(1);
      expect(useSessionStore.getState().sessions.length).toBe(2);
      expect(useSessionStore.getState().sessions[0].id).toBe('s1');
      expect(useSessionStore.getState().isLoading).toBe(false);
      expect(useSessionStore.getState().activeSessionId).toBe('s1'); // First session becomes active
      expect(mockedChatStoreActions.loadMessagesForSession).toHaveBeenCalledWith('s1');
      expect(mockedChatStoreActions.setSelectedModelId).toHaveBeenCalledWith('m1');
      expect(mockedChatStoreActions.setCurrentTemperature).toHaveBeenCalledWith(0.5);
    });

    it('should handle empty sessions list by setting activeSessionId to null', async () => {
      (sessionService.getSessions as vi.Mock).mockResolvedValue([]);
      await useSessionStore.getState().fetchSessions();
      expect(useSessionStore.getState().sessions.length).toBe(0);
      expect(useSessionStore.getState().activeSessionId).toBeNull();
      expect(mockedChatStoreActions.loadMessagesForSession).toHaveBeenCalledWith(null);
    });

    it('should set error state if API call fails', async () => {
      (sessionService.getSessions as vi.Mock).mockRejectedValue(new Error('API Error'));
      await useSessionStore.getState().fetchSessions();
      expect(useSessionStore.getState().error).toBe('API Error');
      expect(useSessionStore.getState().isLoading).toBe(false);
    });
  });

  describe('setActiveSession', () => {
    it('should update activeSessionId and load messages and settings into chatStore', () => {
      const sessions: Session[] = [
        { id: 's1', title: 'S1', createdAt: 1, updatedAt: 1, selectedModelId: 'model-A', temperature: 0.8 },
        { id: 's2', title: 'S2', createdAt: 2, updatedAt: 2, selectedModelId: 'model-B', temperature: 0.3 },
      ];
      useSessionStore.setState({ sessions, activeSessionId: 's1' }); // Initial state

      useSessionStore.getState().setActiveSession('s2');

      expect(useSessionStore.getState().activeSessionId).toBe('s2');
      expect(mockedChatStoreActions.loadMessagesForSession).toHaveBeenCalledWith('s2');
      expect(mockedChatStoreActions.setSelectedModelId).toHaveBeenCalledWith('model-B');
      expect(mockedChatStoreActions.setCurrentTemperature).toHaveBeenCalledWith(0.3);
    });

     it('should use default model/temp if not set on session', () => {
      const sessions: Session[] = [
        { id: 's1', title: 'S1', createdAt: 1, updatedAt: 1 }, // No model/temp
      ];
      useSessionStore.setState({ sessions });
      const DEFAULT_MODEL_ID = null;
      const DEFAULT_TEMPERATURE = 0.7;

      useSessionStore.getState().setActiveSession('s1');
      expect(mockedChatStoreActions.setSelectedModelId).toHaveBeenCalledWith(DEFAULT_MODEL_ID);
      expect(mockedChatStoreActions.setCurrentTemperature).toHaveBeenCalledWith(DEFAULT_TEMPERATURE);
    });


    it('should clear chatStore settings if sessionId is null', () => {
      useSessionStore.getState().setActiveSession(null);
      expect(useSessionStore.getState().activeSessionId).toBeNull();
      expect(mockedChatStoreActions.loadMessagesForSession).toHaveBeenCalledWith(null);
      // Check if defaults are set in chatStore when no session is active
      const DEFAULT_MODEL_ID = null;
      const DEFAULT_TEMPERATURE = 0.7;
      expect(mockedChatStoreActions.setSelectedModelId).toHaveBeenCalledWith(DEFAULT_MODEL_ID);
      expect(mockedChatStoreActions.setCurrentTemperature).toHaveBeenCalledWith(DEFAULT_TEMPERATURE);
    });
  });

  describe('createNewSession', () => {
    it('should call API, add new session with defaults, set it active, and persist', async () => {
      const rawNewSession: Omit<Session, 'selectedModelId' | 'temperature'> = { id: 'sNew', title: 'New Chat', createdAt: Date.now(), updatedAt: Date.now() };
      (sessionService.createNewSessionAPI as vi.Mock).mockResolvedValue(rawNewSession);

      const newSessionId = await useSessionStore.getState().createNewSession('New Chat');

      expect(sessionService.createNewSessionAPI).toHaveBeenCalledWith('New Chat');
      expect(newSessionId).toBe('sNew');
      const { sessions, activeSessionId } = useSessionStore.getState();
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe('sNew');
      expect(sessions[0].selectedModelId).toBeNull(); // Default model
      expect(sessions[0].temperature).toBe(0.7);   // Default temperature
      expect(activeSessionId).toBe('sNew');
      expect(mockedChatStoreActions.loadMessagesForSession).toHaveBeenCalledWith('sNew');
      expect(Storage.prototype.setItem).toHaveBeenCalled(); // Check persistence
    });
  });

  describe('deleteSession', () => {
    it('should optimistically remove session, call API, and handle active session change', async () => {
      const initialSessions: Session[] = [
        { id: 's1', title: 'S1', createdAt: 1, updatedAt: 1 },
        { id: 's2', title: 'S2', createdAt: 2, updatedAt: 2 },
      ];
      useSessionStore.setState({ sessions: initialSessions, activeSessionId: 's1' });
      (sessionService.deleteSessionAPI as vi.Mock).mockResolvedValue(undefined);
      // Mock createNewSessionAPI for the case where last session is deleted
      const rawNewSession: Omit<Session, 'selectedModelId' | 'temperature'> = { id: 'sNewOnDelete', title: 'New Chat', createdAt: Date.now(), updatedAt: Date.now() };
      (sessionService.createNewSessionAPI as vi.Mock).mockResolvedValue(rawNewSession);


      await useSessionStore.getState().deleteSession('s1');

      expect(sessionService.deleteSessionAPI).toHaveBeenCalledWith('s1');
      const { sessions, activeSessionId } = useSessionStore.getState();
      expect(sessions.find(s => s.id === 's1')).toBeUndefined();
      expect(sessions.length).toBe(1);
      expect(activeSessionId).toBe('s2'); // Should switch to s2
      expect(mockedChatStoreActions.loadMessagesForSession).toHaveBeenCalledWith('s2');

      // Delete the last session
      await useSessionStore.getState().deleteSession('s2');
      expect(sessionService.deleteSessionAPI).toHaveBeenCalledWith('s2');
      // A new session should be created
      expect(sessionService.createNewSessionAPI).toHaveBeenCalledWith('新会话');
      expect(useSessionStore.getState().activeSessionId).toBe('sNewOnDelete');

    });
  });

  describe('updateSessionSettings', () => {
    it('should update settings for a specific session and re-sort', () => {
      const initialSessions: Session[] = [
        { id: 's1', title: 'S1', createdAt: 1, updatedAt: 1, selectedModelId: 'm1', temperature: 0.7 },
        { id: 's2', title: 'S2', createdAt: 2, updatedAt: 2, selectedModelId: 'm2', temperature: 0.3 },
      ];
      useSessionStore.setState({ sessions: initialSessions, activeSessionId: 's1' });

      const newSettings = { selectedModelId: 'mUpdated', temperature: 0.9 };
      const s1PrevUpdatedAt = initialSessions[0].updatedAt;
      useSessionStore.getState().updateSessionSettings('s1', newSettings);

      const updatedS1 = useSessionStore.getState().sessions.find(s => s.id === 's1');
      expect(updatedS1?.selectedModelId).toBe('mUpdated');
      expect(updatedS1?.temperature).toBe(0.9);
      expect(updatedS1?.updatedAt).toBeGreaterThan(s1PrevUpdatedAt); // Check if timestamp updated
      expect(useSessionStore.getState().sessions[0].id).toBe('s1'); // s1 should now be first due to updatedAt
    });
  });

  describe('persist middleware', () => {
    it('should persist sessions and activeSessionId to localStorage', () => {
        const sessions: Session[] = [{ id: 's1', title: 'Test', createdAt: 1, updatedAt: 1, selectedModelId: 'm1', temperature: 0.5 }];
        useSessionStore.setState({ sessions, activeSessionId: 's1' });

        // The `setItem` mock is called by persist middleware automatically on state change.
        // We need to check if it was called with the correct structure.
        expect(Storage.prototype.setItem).toHaveBeenCalled();
        const storedValueCall = (Storage.prototype.setItem as vi.Mock).mock.calls.find(call => call[0] === 'bor-app-session-storage');
        expect(storedValueCall).toBeDefined();
        if (storedValueCall) {
            const storedState = JSON.parse(storedValueCall[1]);
            expect(storedState.state.sessions).toEqual(sessions);
            expect(storedState.state.activeSessionId).toBe('s1');
        }
    });
  });

});
