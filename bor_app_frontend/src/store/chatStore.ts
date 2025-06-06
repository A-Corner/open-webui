// bor_app_frontend/src/store/chatStore.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ChatMessageSender, ChatOptions } from '../types/chat';
import type { ChatModelResponse } from '../types/models';
import type { RetrievedSource } from '../types/rag'; // Import RetrievedSource
import { sendChatMessageStream, editChatMessage as apiEditMessage, deleteChatMessage as apiDeleteMessage } from '../api/chatService';
import { getMessagesAPI } from '../api/sessionService';
import { getSelectableChatModels as apiGetModels } from '../api/modelService';
import { useSessionStore } from './sessionStore'; // To update session-specific settings

// Define default model and temperature, can be moved to a config file later
// These are defaults for the store if a session doesn't specify them.
const STORE_DEFAULT_MODEL_ID = null;
const STORE_DEFAULT_TEMPERATURE = 0.7;

interface ChatState {
  messages: ChatMessage[];
  isSending: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  abortController: AbortController | null;

  // Model and Temperature settings (for the active chat)
  availableModels: ChatModelResponse[];
  selectedModelId: string | null;
  currentTemperature: number;
  isLoadingModels: boolean;
  errorModels: string | null;

  // Message editing state
  editingMessageId: string | null; // ID of the message being edited
  editingMessageContent: string; // Current content while editing

  // Actions
  addMessage: (sender: ChatMessageSender, content: string, isLoading?: boolean, messageId?: string) => string;
  sendMessage: (userInput: string, options?: ChatOptions, currentChatHistory?: ChatMessage[]) => Promise<void>;
  updateLastMessageChunk: (messageId: string, contentChunk: string, isDone?: boolean) => void;
  setMessageError: (messageId: string, error: string) => void;
  clearChat: () => void;
  cancelStream: () => void;
  loadMessagesForSession: (sessionId: string | null) => Promise<void>;

  // New actions for model and temperature
  fetchAvailableChatModels: () => Promise<void>;
  setSelectedModelId: (modelId: string | null) => void;
  setCurrentTemperature: (temp: number) => void;

  // New actions for message editing/deletion
  startEditMessage: (messageId: string, initialContent: string) => void;
  cancelEditMessage: () => void;
  submitEditMessage: (newContent: string) => Promise<void>;
  removeMessage: (messageId: string) => Promise<void>;
}

const initialState = {
  messages: [],
  isSending: false,
  isLoadingMessages: false,
  error: null,
  abortController: null,
  availableModels: [],
  selectedModelId: STORE_DEFAULT_MODEL_ID,
  currentTemperature: STORE_DEFAULT_TEMPERATURE,
  isLoadingModels: false,
  errorModels: null,
  editingMessageId: null,
  editingMessageContent: '',
};

export const useChatStore = create<ChatState>()((set, get) => ({
  ...initialState,

  fetchAvailableChatModels: async () => {
    set({ isLoadingModels: true, errorModels: null });
    try {
      const models = await apiGetModels();
      set({ availableModels: models, isLoadingModels: false });
      // Optionally set a default selected model if none is selected yet
      // Or if the current selectedModelId is not in the new list of availableModels
      const currentSelected = get().selectedModelId;
      if (!currentSelected || !models.find(m => m.id === currentSelected)) {
        if (models.length > 0) {
            // Try to find a sensible default, e.g., the first one or one marked as 'default' by backend
            // For now, just setting to the first one if current selection is invalid.
            // This might also be influenced by sessionStore loading its preferred model.
            // get().setSelectedModelId(models[0].id); // Let sessionStore handle setting initial model for chat
        } else {
            get().setSelectedModelId(null); // No models available
        }
      }
    } catch (error: any) {
      set({ errorModels: error.message, isLoadingModels: false, availableModels: [] });
    }
  },

  setSelectedModelId: (modelId) => {
    set({ selectedModelId: modelId });
    const activeSessionId = useSessionStore.getState().activeSessionId;
    if (activeSessionId) {
      useSessionStore.getState().updateSessionSettings(activeSessionId, { selectedModelId: modelId });
    }
  },

  setCurrentTemperature: (temp) => {
    set({ currentTemperature: temp });
    const activeSessionId = useSessionStore.getState().activeSessionId;
    if (activeSessionId) {
      useSessionStore.getState().updateSessionSettings(activeSessionId, { temperature: temp });
    }
  },

  loadMessagesForSession: async (sessionId) => {
    if (!sessionId) {
      set({ ...initialState }); // Reset to initial state, including model/temp to defaults
      return;
    }
    set({ isLoadingMessages: true, error: null, messages: [] });
    try {
      const messages = await getMessagesAPI(sessionId);
      set({ messages, isLoadingMessages: false });
      // SessionStore's setActiveSession should handle loading model/temp from session into this store
    } catch (error: any) {
      set({ error: error.message, isLoadingMessages: false, messages: [] });
    }
  },

  addMessage: (sender, content, isLoading = false, messageId) => {
    const id = messageId || uuidv4();
    const newMessage: ChatMessage = { id, sender, content, timestamp: Date.now(), isLoading };
    set(state => ({ messages: [...state.messages, newMessage] }));
    return id;
  },

  sendMessage: async (userInput, options, currentChatHistory) => {
    if (get().isSending) return;
    const userMessageId = get().addMessage('user', userInput);
    const assistantMessageId = get().addMessage('assistant', '', true);

    set({ isSending: true, error: null, abortController: null });
    const historyForAPI = (currentChatHistory || get().messages)
        .filter(msg => msg.id !== userMessageId && msg.id !== assistantMessageId)
        .map(msg => ({ sender: msg.sender, content: msg.content }));

    // Merge store's current model/temp with any ad-hoc options from ChatInput
    const finalOptions: ChatOptions = {
        model: get().selectedModelId || undefined,
        temperature: get().currentTemperature,
        ...options, // Ad-hoc options from input (like knowledge_id) can override store's model/temp for this call
    };

    const controller = sendChatMessageStream(
      historyForAPI,
      userInput,
      {
        onChunk: (chunkContent) => get().updateLastMessageChunk(assistantMessageId, chunkContent, false),
        onComplete: (finalSources) => { // finalSources is new from chatService
          get().updateLastMessageChunk(assistantMessageId, '', true, finalSources); // Pass sources
          set({ isSending: false, abortController: null });
          // After a message is sent, the session's updatedAt changes.
          // Fetching sessions can update the order in the sidebar.
          useSessionStore.getState().fetchSessions();
        },
        onError: (error) => {
          get().setMessageError(assistantMessageId, error.message);
          set({ isSending: false, abortController: null });
        },
      },
      finalOptions, // Pass merged options
    );
    set({ abortController: controller });
  },

  updateLastMessageChunk: (messageId, contentChunk, isDone = false, sources?: RetrievedSource[]) => { // Added sources param
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              content: msg.content + contentChunk,
              isLoading: !isDone,
              timestamp: Date.now(),
              retrieved_sources: isDone ? sources : msg.retrieved_sources, // Add sources when done
            }
          : msg
      ),
    }));
  },

  setMessageError: (messageId, error) => {
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, isLoading: false, error: error } : msg
      ),
    }));
  },

  clearChat: () => {
    get().cancelStream();
    set({ messages: [], error: null });
    // Note: This doesn't clear server-side messages. A dedicated API would be needed.
  },

  cancelStream: () => {
     get().abortController?.abort();
     set(state => {
        const lastLoadingMsgIndex = state.messages.slice().reverse().findIndex(m => m.isLoading);
        if (lastLoadingMsgIndex !== -1) {
            const idx = state.messages.length - 1 - lastLoadingMsgIndex;
            const updatedMessages = [...state.messages];
            updatedMessages[idx] = { ...updatedMessages[idx], isLoading: false, content: updatedMessages[idx].content + '\n(操作已取消)', error: '用户已取消' };
            return { messages: updatedMessages, isSending: false, abortController: null };
        }
        return { isSending: false, abortController: null };
     });
  },

  // Message Editing actions
  startEditMessage: (messageId, initialContent) => {
    set({ editingMessageId: messageId, editingMessageContent: initialContent });
  },

  cancelEditMessage: () => {
    set({ editingMessageId: null, editingMessageContent: '' });
  },

  submitEditMessage: async (newContent) => {
    const messageId = get().editingMessageId;
    const activeSessionId = useSessionStore.getState().activeSessionId;
    if (!messageId || !activeSessionId) return;

    // Optimistic update
    const oldMessages = get().messages;
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, content: newContent, timestamp: Date.now() } : msg
      ),
      editingMessageId: null,
      editingMessageContent: '',
    }));

    try {
      await apiEditMessage(activeSessionId, messageId, newContent);
      // Optional: Re-fetch message or session to confirm, or rely on optimistic update.
      // For now, optimistic update is considered sufficient.
       useSessionStore.getState().fetchSessions(); // Refresh session list for updatedAt changes
    } catch (error: any) {
      set({ messages: oldMessages, error: error.message }); // Rollback on error
    }
  },

  removeMessage: async (messageId) => {
    const activeSessionId = useSessionStore.getState().activeSessionId;
    if (!activeSessionId) return;

    const oldMessages = get().messages;
    set(state => ({
      messages: state.messages.filter(msg => msg.id !== messageId),
    }));

    try {
      await apiDeleteMessage(activeSessionId, messageId);
      useSessionStore.getState().fetchSessions(); // Refresh session list for updatedAt changes
    } catch (error: any) {
      set({ messages: oldMessages, error: error.message }); // Rollback
    }
  },
}));
