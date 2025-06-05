import { create } from 'zustand';
import adminModelService, {
  type ModelResponse,
  type ModelPullPayload,
  type ModelSettings,
  type ModelSettingsResponse,
  type ModelSettingsUpdatePayload,
  type RemoteModelServiceConfig,
  type RemoteModelServiceCreatePayload,
  type RemoteModelServiceUpdatePayload,
  type ModelPullResponse,
} from '../api/adminModelService'; // Adjust path

interface ModelManagementState {
  models: ModelResponse[];
  settings: ModelSettings | null;
  isLoadingModels: boolean;
  isLoadingSettings: boolean;
  isPullingModel: boolean;
  isDeletingModel: Record<string, boolean>;
  errorModels: string | null;
  errorSettings: string | null;
  errorPulling: string | null;
  errorDeleting: string | null;

  remoteModelServices: RemoteModelServiceConfig[];
  isLoadingRemoteServices: boolean;
  errorRemoteServices: string | null;

  fetchModels: (source?: string) => Promise<void>;
  pullModel: (payload: ModelPullPayload) => Promise<ModelPullResponse>; // Updated return type
  deleteModel: (modelId: string, modelName: string) => Promise<boolean>;

  fetchSettings: () => Promise<void>;
  saveSettings: (payload: ModelSettingsUpdatePayload) => Promise<boolean>;

  fetchRemoteModelServices: () => Promise<void>;
  addRemoteModelService: (payload: RemoteModelServiceCreatePayload) => Promise<RemoteModelServiceConfig | null>;
  updateRemoteModelService: (serviceId: string, payload: RemoteModelServiceUpdatePayload) => Promise<RemoteModelServiceConfig | null>;
  deleteRemoteModelService: (serviceId: string) => Promise<boolean>;
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

  remoteModelServices: [],
  isLoadingRemoteServices: false,
  errorRemoteServices: null,

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
      const response = await adminModelService.pullOllamaModel(payload);
      set({ isPullingModel: false });
      // Caller should check response.status and refresh models if needed
      if (response.status === "pulling_started" || response.status === "already_exists") {
        get().fetchModels('ollama'); // Refresh Ollama models
      }
      return response;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to pull model.';
      set({ errorPulling: error, isPullingModel: false });
      return { status: "error", message: error, model_name: payload.model_name };
    }
  },

  deleteModel: async (modelId: string, modelName: string) => {
    set(state => ({ isDeletingModel: { ...state.isDeletingModel, [modelId]: true }, errorDeleting: null }));
    try {
      await adminModelService.deleteOllamaModel(modelName);
      set(state => ({
        models: state.models.filter(m => m.id !== modelId),
        isDeletingModel: { ...state.isDeletingModel, [modelId]: false },
      }));
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || `Failed to delete model ${modelName}.`;
      set(state => ({
        errorDeleting: error,
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
    set({ isLoadingSettings: true, errorSettings: null });
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

  fetchRemoteModelServices: async () => {
    set({ isLoadingRemoteServices: true, errorRemoteServices: null });
    try {
      const services = await adminModelService.getRemoteModelServices();
      set({ remoteModelServices: services, isLoadingRemoteServices: false });
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to fetch remote model services.';
      set({ errorRemoteServices: error, isLoadingRemoteServices: false, remoteModelServices: [] });
    }
  },

  addRemoteModelService: async (payload: RemoteModelServiceCreatePayload) => {
    // set({ isLoadingRemoteServices: true }); // Or a specific 'isUpdating/Creating' state
    try {
      const newService = await adminModelService.createRemoteModelService(payload);
      set(state => ({
        remoteModelServices: [...state.remoteModelServices, newService],
        // isLoadingRemoteServices: false,
      }));
      return newService;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to add remote model service.';
      set({ errorRemoteServices: error }); // Or a specific error state for this action
      return null;
    }
  },

  updateRemoteModelService: async (serviceId: string, payload: RemoteModelServiceUpdatePayload) => {
    // set({ isLoadingRemoteServices: true });
    try {
      const updatedService = await adminModelService.updateRemoteModelService(serviceId, payload);
      set(state => ({
        remoteModelServices: state.remoteModelServices.map(s => s.id === serviceId ? updatedService : s),
        // isLoadingRemoteServices: false,
      }));
      return updatedService;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to update remote model service.';
      set({ errorRemoteServices: error });
      return null;
    }
  },

  deleteRemoteModelService: async (serviceId: string) => {
    // set(state => ({ isDeletingRemoteService: { ...state.isDeletingRemoteService, [serviceId]: true }}));
    try {
      await adminModelService.deleteRemoteModelService(serviceId);
      set(state => ({
        remoteModelServices: state.remoteModelServices.filter(s => s.id !== serviceId),
        // isDeletingRemoteService: { ...state.isDeletingRemoteService, [serviceId]: false },
      }));
      return true;
    } catch (err: any) {
      const error = err.response?.data?.detail || err.message || 'Failed to delete remote model service.';
      set({ errorRemoteServices: error });
      // set(state => ({ isDeletingRemoteService: { ...state.isDeletingRemoteService, [serviceId]: false }}));
      return false;
    }
  }
}));
