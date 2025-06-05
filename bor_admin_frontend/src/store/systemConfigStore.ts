import { create } from 'zustand';
import adminConfigService, {
  type ConfigResponse,
  type ConfigUpdateRequest,
  type ConfigValue,
  type ConfigItem,
} from '../api/adminConfigService'; // Adjust path as needed

interface SystemConfigState {
  configs: Record<string, ConfigValue> | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  fetchConfigs: () => Promise<void>;
  updateConfigs: (configsToUpdate: ConfigItem[]) => Promise<boolean>; // Returns true on success
  setConfigValue: (key: string, value: ConfigValue) => void; // For optimistic updates or local changes
}

export const useSystemConfigStore = create<SystemConfigState>((set, get) => ({
  configs: null,
  isLoading: false,
  isUpdating: false,
  error: null,

  fetchConfigs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminConfigService.getSystemConfigs();
      set({ configs: response.configs, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch system configurations.';
      set({ error: errorMessage, isLoading: false, configs: null });
      // Do not throw here, let UI components handle error display from store
    }
  },

  updateConfigs: async (configsToUpdate: ConfigItem[]) => {
    set({ isUpdating: true, error: null });
    try {
      const updatePayload: ConfigUpdateRequest = { configs: configsToUpdate };
      const response = await adminConfigService.updateSystemConfigs(updatePayload);
      set({ configs: response.configs, isUpdating: false });
      return true; // Indicate success
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update system configurations.';
      set({ error: errorMessage, isUpdating: false });
      // Potentially revert optimistic updates here if implemented
      // Do not throw here, let UI components handle error display from store
      return false; // Indicate failure
    }
  },

  setConfigValue: (key: string, value: ConfigValue) => {
    set((state) => ({
      configs: state.configs ? { ...state.configs, [key]: value } : { [key]: value },
    }));
  },
}));

// Optional: Initial fetch when store is created/app loads,
// but usually better to trigger this from a relevant component's onMount or App.tsx
// useSystemConfigStore.getState().fetchConfigs();
