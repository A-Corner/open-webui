// bor_app_frontend/src/store/ragStore.ts
import { create } from 'zustand';
import type { SelectableKnowledgeSource } from '../types/knowledge';
import { getSelectableKnowledgeSources as apiGetSelectableSources } from '../api/knowledgeService';

// 中文注释：管理RAG功能相关的状态

interface RagState {
  availableSources: SelectableKnowledgeSource[]; // 用户可选的知识源列表
  selectedSourceId: string | null; // 当前选中的知识源ID
  isLoadingSources: boolean;
  errorSources: string | null;

  // Actions
  fetchAvailableSources: () => Promise<void>;
  setSelectedSourceId: (sourceId: string | null) => void;
  clearSelectedSource: () => void;
}

export const useRagStore = create<RagState>()((set, get) => ({
  availableSources: [],
  selectedSourceId: null,
  isLoadingSources: false,
  errorSources: null,

  fetchAvailableSources: async () => {
    set({ isLoadingSources: true, errorSources: null });
    try {
      const sources = await apiGetSelectableSources();
      set({ availableSources: sources, isLoadingSources: false });
    } catch (error: any) {
      set({ errorSources: error.message, isLoadingSources: false, availableSources: [] }); // Clear sources on error
    }
  },

  setSelectedSourceId: (sourceId) => {
    set({ selectedSourceId: sourceId });
  },

  clearSelectedSource: () => {
    set({ selectedSourceId: null });
  }
}));
