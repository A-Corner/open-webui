// bor_app_frontend/src/store/sessionStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Session } from '../types/session';
import { getSessions as apiGetSessions, createNewSessionAPI as apiCreateSession, deleteSessionAPI as apiDeleteSession } from '../api/sessionService';
import { useChatStore } from './chatStore'; // 用于在切换或删除会话时操作chatStore

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessions: () => Promise<void>;
  setActiveSession: (sessionId: string | null) => void;
  createNewSession: (title?: string, initialModelId?: string, initialTemperature?: number) => Promise<string | null>; // 返回新会话ID
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionSettings: (sessionId: string, settings: { selectedModelId?: string; temperature?: number }) => void;
}

// Define default model and temperature, can be moved to a config file later
const DEFAULT_MODEL_ID = null; // Or a specific default model ID like "ollama/llama3"
const DEFAULT_TEMPERATURE = 0.7;


export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [], // This will now be persisted with model and temp
      activeSessionId: null,
      isLoading: false,
      error: null,

      fetchSessions: async () => {
        set({ isLoading: true, error: null });
        try {
          const fetchedSessions = await apiGetSessions();
          // Ensure fetched sessions have default model/temp if not provided by backend
          const sessionsWithDefaults = fetchedSessions.map(s => ({
            ...s,
            selectedModelId: s.selectedModelId || DEFAULT_MODEL_ID,
            temperature: s.temperature === undefined ? DEFAULT_TEMPERATURE : s.temperature,
          }));
          set({ sessions: sessionsWithDefaults, isLoading: false });

          const currentActiveId = get().activeSessionId;
          const activeSessionIsValid = sessionsWithDefaults.some(s => s.id === currentActiveId);

          if (sessionsWithDefaults.length > 0) {
            if (!currentActiveId || !activeSessionIsValid) {
              get().setActiveSession(sessionsWithDefaults[0].id);
            } else {
              // If current active ID is still valid, ensure chatStore is updated with its settings
              const activeSession = sessionsWithDefaults.find(s => s.id === currentActiveId);
              if (activeSession) {
                useChatStore.getState().loadMessagesForSession(currentActiveId);
                useChatStore.getState().setSelectedModelId(activeSession.selectedModelId || DEFAULT_MODEL_ID);
                useChatStore.getState().setCurrentTemperature(activeSession.temperature === undefined ? DEFAULT_TEMPERATURE : activeSession.temperature);
              }
            }
          } else {
            get().setActiveSession(null);
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false, sessions: [] });
        }
      },

      setActiveSession: (sessionId) => {
        const currentActiveId = get().activeSessionId;

        if (currentActiveId !== sessionId) {
          set({ activeSessionId: sessionId });
        }

        useChatStore.getState().loadMessagesForSession(sessionId); // Load messages for the new session

        if (sessionId) {
          const activeSessionData = get().sessions.find(s => s.id === sessionId);
          if (activeSessionData) {
            useChatStore.getState().setSelectedModelId(activeSessionData.selectedModelId || DEFAULT_MODEL_ID);
            useChatStore.getState().setCurrentTemperature(activeSessionData.temperature === undefined ? DEFAULT_TEMPERATURE : activeSessionData.temperature);
          } else {
            // Session not found in list, maybe it was just created and list not updated yet, or an error
            // For now, set chatStore to defaults. createNewSession should handle setting these correctly.
            useChatStore.getState().setSelectedModelId(DEFAULT_MODEL_ID);
            useChatStore.getState().setCurrentTemperature(DEFAULT_TEMPERATURE);
          }
        } else { // No active session
          useChatStore.getState().setSelectedModelId(DEFAULT_MODEL_ID);
          useChatStore.getState().setCurrentTemperature(DEFAULT_TEMPERATURE);
          // chatStore.loadMessagesForSession(null) already clears messages
        }
      },

      createNewSession: async (title, initialModelId = DEFAULT_MODEL_ID, initialTemperature = DEFAULT_TEMPERATURE) => {
        set({ isLoading: true });
        try {
          // Call API to create session. Backend might not support setting model/temp on creation.
          // These are primarily frontend session-specific settings for now.
          const rawNewSession = await apiCreateSession(title);
          const newSession: Session = {
            ...rawNewSession,
            selectedModelId: initialModelId,
            temperature: initialTemperature,
          };

          set(state => ({
            sessions: [newSession, ...state.sessions].sort((a, b) => b.updatedAt - a.updatedAt),
            isLoading: false,
          }));
          get().setActiveSession(newSession.id);
          return newSession.id;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },

      deleteSession: async (sessionId) => {
        const oldSessions = get().sessions;
        const oldActiveSessionId = get().activeSessionId;

        set(state => ({
            sessions: state.sessions.filter(s => s.id !== sessionId)
        }));

        try {
          await apiDeleteSession(sessionId);
          if (oldActiveSessionId === sessionId) {
            const remainingSessions = get().sessions;
            if (remainingSessions.length > 0) {
              get().setActiveSession(remainingSessions[0].id);
            } else {
              const newSessionId = await get().createNewSession('新会话');
              if (!newSessionId) {
                 get().setActiveSession(null);
              }
            }
          }
        } catch (error: any) {
          set({ error: error.message, sessions: oldSessions });
        }
      },

      updateSessionSettings: (sessionId, settings) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, ...settings, updatedAt: Date.now() } // Update timestamp for sorting
              : session
          ).sort((a,b) => b.updatedAt - a.updatedAt), // Re-sort if updatedAt changed
        }));
      }
    }),
    {
      name: 'bor-app-session-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist the entire sessions array along with activeSessionId
      partialize: (state) => ({ sessions: state.sessions, activeSessionId: state.activeSessionId }),
    }
  )
);
