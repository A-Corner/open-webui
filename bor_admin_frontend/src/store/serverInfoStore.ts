import { create } from 'zustand';
import adminServerInfoService, { type ServerInfoResponse } from '../api/adminServerInfoService'; // Adjust path

interface ServerInfoState {
  info: ServerInfoResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchServerInfo: () => Promise<void>;
}

export const useServerInfoStore = create<ServerInfoState>((set) => ({
  info: null,
  isLoading: false,
  error: null,

  fetchServerInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverInfo = await adminServerInfoService.getServerInfo();
      set({ info: serverInfo, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch server information.';
      set({ error: errorMessage, isLoading: false, info: null });
    }
  },
}));
