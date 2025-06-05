// bor_app_frontend/src/store/userSettingsStore.spec.ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useUserSettingsStore, initializeCurrentTheme } from './userSettingsStore'; // Assuming initializeCurrentTheme is exported for testing or direct call
import type { ThemePreference } from '../types/settings';

// Helper to reset store to initial state
const resetUserSettingsStore = () => useUserSettingsStore.setState(useUserSettingsStore.getInitialState(), true);

// Mock document.documentElement.classList
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  toggle: vi.fn(), // if used
};

// Mock window.matchMedia
const mockMatchMedia = vi.fn();


describe('userSettingsStore', () => {
  let originalDocumentElement: HTMLElement;

  beforeEach(() => {
    vi.resetAllMocks();
    resetUserSettingsStore();

    // Store original documentElement and define classList on it
    originalDocumentElement = document.documentElement;
    Object.defineProperty(global.document, 'documentElement', {
      writable: true,
      configurable: true, // Allow redefining
      value: {
        ...originalDocumentElement, // Spread original properties
        classList: mockClassList,
      },
    });

    // Mock window.matchMedia
    Object.defineProperty(global.window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: mockMatchMedia,
    });

    // Mock localStorage for persist middleware
    Storage.prototype.getItem = vi.fn();
    Storage.prototype.setItem = vi.fn();
    Storage.prototype.removeItem = vi.fn();
  });

  afterEach(() => {
     Object.defineProperty(global.document, 'documentElement', { // Restore original
        value: originalDocumentElement,
        writable: true,
        configurable: true,
     });
     vi.restoreAllMocks(); // Restore matchMedia and other mocks
  });


  describe('setTheme', () => {
    it('should update theme in state and apply "light" class to documentElement', () => {
      useUserSettingsStore.getState().setTheme('light');
      expect(useUserSettingsStore.getState().theme).toBe('light');
      expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockClassList.add).toHaveBeenCalledWith('light');
    });

    it('should update theme in state and apply "dark" class to documentElement', () => {
      useUserSettingsStore.getState().setTheme('dark');
      expect(useUserSettingsStore.getState().theme).toBe('dark');
      expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockClassList.add).toHaveBeenCalledWith('dark');
    });

    it('should apply "dark" class if theme is "system" and system prefers dark', () => {
      mockMatchMedia.mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
      useUserSettingsStore.getState().setTheme('system');
      expect(useUserSettingsStore.getState().theme).toBe('system');
      expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockClassList.add).toHaveBeenCalledWith('dark');
    });

    it('should apply "light" class if theme is "system" and system prefers light', () => {
      mockMatchMedia.mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
      useUserSettingsStore.getState().setTheme('system');
      expect(useUserSettingsStore.getState().theme).toBe('system');
      expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockClassList.add).toHaveBeenCalledWith('light');
    });
  });

  describe('initializeCurrentTheme (or onRehydrateStorage)', () => {
    it('should apply rehydrated theme on startup via onRehydrateStorage', () => {
      // Simulate rehydration by directly calling the onRehydrateStorage logic if possible,
      // or by checking effect of initializeCurrentTheme which does similar.
      // The persist middleware calls onRehydrateStorage. We'll test initializeCurrentTheme
      // as it achieves a similar outcome for initial load.

      mockMatchMedia.mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }); // System prefers dark
      // Simulate that 'system' was persisted and rehydrated
      useUserSettingsStore.setState({ theme: 'system' });

      initializeCurrentTheme(); // This function calls applyThemeToDocument

      expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(mockClassList.add).toHaveBeenCalledWith('dark'); // System is dark
    });

    it('should apply "dark" theme if it was persisted', () => {
        useUserSettingsStore.setState({ theme: 'dark' });
        initializeCurrentTheme();
        expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark');
        expect(mockClassList.add).toHaveBeenCalledWith('dark');
    });
  });

  describe('persist middleware', () => {
    it('should persist theme to localStorage', () => {
      useUserSettingsStore.getState().setTheme('dark');
      // The `setItem` mock is called by persist middleware automatically on state change.
      expect(Storage.prototype.setItem).toHaveBeenCalled();
      const storedValueCall = (Storage.prototype.setItem as vi.Mock).mock.calls.find(call => call[0] === 'bor-app-user-settings-storage');
      expect(storedValueCall).toBeDefined();
      if (storedValueCall) {
        const storedState = JSON.parse(storedValueCall[1]);
        expect(storedState.state.theme).toBe('dark');
      }
    });
  });
});
