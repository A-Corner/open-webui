import { create } from 'zustand';
import adminModelService, {
  type ModelResponse,
  type ModelPullPayload,
  type ModelSettings,
  type ModelSettingsResponse,
  type ModelSettingsUpdatePayload,
} from '../api/adminModelService'; // Adjust path

interface ModelManagementState {
  models: ModelResponse[];
  settings: ModelSettings | null;
  isLoadingModels: boolean;
  isLoadingSettings: boolean;
  isPullingModel: boolean;
  isDeletingModel: Record<string, boolean>; // To track loading state per model ID for delete
  errorModels: string | null;
  errorSettings: string | null;
  errorPulling: string | null;
  errorDeleting: string | null; // General delete error, or could be per-model

  fetchModels: (source?: string) => Promise<void>;
  pullModel: (payload: ModelPullPayload) => Promise<{ success: boolean; message?: string }>;
  deleteModel: (modelId: string, modelName: string) => Promise<boolean>; // modelId for state, modelName for API

  fetchSettings: () => Promise<void>;
  saveSettings: (payload: ModelSettingsUpdatePayload) => Promise<boolean>;
}

export const useModelManagementStore = create<ModelManagementState>((set, get) => ({
  models: [],
  settings: null,
  isLoadingModels: false,
  isLoadingSettings: false,
  isPullingModel: false,
  isDeletingModel: {},
  errorModels: null,
  errorSettings: null,
  errorPulling: null,
  errorDeleting: null,

  fetchModels: async (source?: string) => {
    set({ isLoadingModels: true, errorModels: null });
    try {
      const models = await adminModelService.getModels(source);
      set({ models, isLoadingModels: false });
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to fetch models.';
      set({ errorModels: error, isLoadingModels: false, models: [] });
    }
  },

  pullModel: async (payload: ModelPullPayload) => {
    set({ isPullingModel: true, errorPulling: null });
    try {
      // Assuming API returns a success message or specific status for async start
      const response = await adminModelService.pullOllamaModel(payload);
      set({ isPullingModel: false });
      // After pull, refresh model list to see the new model (or if backend sends updated list)
      // For now, caller should handle refresh.
      // Or, if response contains the new model or task ID:
      // get().fetchModels('ollama'); // Example refresh
      return { success: true, message: response?.message || 'Model pull initiated.' };
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to pull model.';
      set({ errorPulling: error, isPullingModel: false });
      return { success: false, message: error };
    }
  },

  deleteModel: async (modelId: string, modelName: string) => { // modelId is full ID, modelName is for API path
    set(state => ({ isDeletingModel: { ...state.isDeletingModel, [modelId]: true }, errorDeleting: null }));
    try {
      await adminModelService.deleteOllamaModel(modelName); // Assumes modelName is just e.g. "llama3:latest"
      set(state => ({
        models: state.models.filter(m => m.id !== modelId), // Optimistic update
        isDeletingModel: { ...state.isDeletingModel, [modelId]: false },
      }));
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || `Failed to delete model ${modelName}.`;
      set(state => ({
        errorDeleting: error, // Store general error or could be specific to modelId
        isDeletingModel: { ...state.isDeletingModel, [modelId]: false }
      }));
      return false;
    }
  },

  fetchSettings: async () => {
    set({ isLoadingSettings: true, errorSettings: null });
    try {
      const settings = await adminModelService.getModelSettings();
      set({ settings, isLoadingSettings: false });
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to fetch model settings.';
      set({ errorSettings: error, isLoadingSettings: false, settings: null });
    }
  },

  saveSettings: async (payload: ModelSettingsUpdatePayload) => {
    set({ isLoadingSettings: true, errorSettings: null }); // Can use isUpdatingSettings if more granular
    try {
      const updatedSettings = await adminModelService.updateModelSettings(payload);
      set({ settings: updatedSettings, isLoadingSettings: false });
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to update model settings.';
      set({ errorSettings: error, isLoadingSettings: false });
      return false;
    }
  },
}));
