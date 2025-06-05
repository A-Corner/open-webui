// bor_app_frontend/src/store/userSettingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemePreference } from '../types/settings';

// 中文注释：管理用户界面偏好设置，如主题

interface UserSettingsState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  // 其他偏好设置可以后续添加
}

const applyThemeToDocument = (theme: ThemePreference) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark'); // 移除旧主题类名

  if (theme === 'system') {
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(systemIsDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
};

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      theme: 'system', // 默认主题为跟随系统
      setTheme: (newTheme) => {
        set({ theme: newTheme });
        applyThemeToDocument(newTheme); // 应用主题到文档
      },
    }),
    {
      name: 'bor-app-user-settings-storage', // localStorage中的key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }), // 只持久化theme
      onRehydrateStorage: () => { // Called when state is rehydrated from storage
        return (state) => {
          if (state) {
            applyThemeToDocument(state.theme); // Apply rehydrated theme on startup
          }
        };
      }
    }
  )
);

// Helper function to apply the initial theme when the app loads.
// This is slightly different from the subtask's `applyInitialTheme` which calls setTheme.
// This approach directly applies the theme from the rehydrated state.
// If `onRehydrateStorage` works as expected, this explicit call might be redundant,
// but it's safer to ensure it's applied if `App.tsx` calls it.
export const initializeCurrentTheme = () => {
  const currentTheme = useUserSettingsStore.getState().theme;
  applyThemeToDocument(currentTheme);
};
