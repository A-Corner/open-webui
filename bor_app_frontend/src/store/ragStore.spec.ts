// bor_app_frontend/src/store/ragStore.spec.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRagStore } from './ragStore';
import * as knowledgeService from '../api/knowledgeService'; // Mock entire module
import type { SelectableKnowledgeSource } from '../types/knowledge';

// Mock knowledgeService
vi.mock('../api/knowledgeService');

// Helper to reset store to initial state
const resetRagStore = () => useRagStore.setState(useRagStore.getInitialState(), true);

describe('ragStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetRagStore();
  });

  describe('fetchAvailableSources', () => {
    it('should fetch sources and update state on success', async () => {
      const mockSources: SelectableKnowledgeSource[] = [
        { id: 'src1', name: 'Source 1', type: 'collection', description: 'Desc 1' },
        { id: 'src2', name: 'Source 2', type: 'collection' },
      ];
      (knowledgeService.getSelectableKnowledgeSources as vi.Mock).mockResolvedValue(mockSources);

      await useRagStore.getState().fetchAvailableSources();

      expect(knowledgeService.getSelectableKnowledgeSources).toHaveBeenCalledTimes(1);
      expect(useRagStore.getState().availableSources).toEqual(mockSources);
      expect(useRagStore.getState().isLoadingSources).toBe(false);
      expect(useRagStore.getState().errorSources).toBeNull();
    });

    it('should set error state and clear sources if API call fails', async () => {
      (knowledgeService.getSelectableKnowledgeSources as vi.Mock).mockRejectedValue(new Error('API Fetch Error'));

      await useRagStore.getState().fetchAvailableSources();

      expect(useRagStore.getState().errorSources).toBe('API Fetch Error');
      expect(useRagStore.getState().isLoadingSources).toBe(false);
      expect(useRagStore.getState().availableSources).toEqual([]); // Should clear sources on error
    });
  });

  describe('setSelectedSourceId', () => {
    it('should update selectedSourceId in state', () => {
      useRagStore.getState().setSelectedSourceId('src123');
      expect(useRagStore.getState().selectedSourceId).toBe('src123');

      useRagStore.getState().setSelectedSourceId(null);
      expect(useRagStore.getState().selectedSourceId).toBeNull();
    });
  });

  describe('clearSelectedSource', () => {
    it('should set selectedSourceId to null', () => {
      useRagStore.setState({ selectedSourceId: 'src-abc' }); // Set an initial selected ID

      useRagStore.getState().clearSelectedSource();

      expect(useRagStore.getState().selectedSourceId).toBeNull();
    });
  });
});
