import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// Assuming a shared authService or a new one for app-specific auth flows if different
// For now, let's assume we need an app-specific authService or adapt the existing one.
// For this example, let's create a conceptual appAuthService that might wrap/reuse calls.

// Placeholder for actual API service functions
// These would typically call backend endpoints like /api/v1/auths/login/db, /api/v1/users/me etc.
// For simplicity, we'll assume an authService similar to the admin one.
import appAuthService, { type User, type LoginResponse } from '../api/appAuthService'; // This file will need to be created

export const APP_AUTH_TOKEN_STORAGE_KEY_FOR_STORE = 'app_auth_token_in_store'; // Zustand persist key

interface UserSessionState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null; // This token will be persisted by Zustand's middleware
  isLoading: boolean;
  error: string | null;
  loginAction: (credentials: { username_or_email: string; password: string }) => Promise<void>;
  logoutAction: (isUserInitiated?: boolean) => Promise<void>;
  loadSessionAction: () => Promise<void>; // Load user from stored token
  clearError: () => void;
}

export const useUserSessionStore = create<UserSessionState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null, // Will be rehydrated from localStorage by persist middleware
      isLoading: false, // For login/logout/load actions
      error: null,

      clearError: () => set({ error: null }),

      loginAction: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await appAuthService.login(credentials); // Assuming appAuthService.login returns LoginResponse
          const { access_token, user } = response;
          set({
            isAuthenticated: true,
            user,
            token: access_token,
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          const errorMessage = err.response?.data?.detail || err.message || 'Login failed';
          set({
            isAuthenticated: false,
            user: null,
            token: null, // Clear token on login failure
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      logoutAction: async (isUserInitiated = true) => {
        const currentToken = get().token;
        set({ isLoading: true });
        try {
          if (isUserInitiated && currentToken) {
             // Only call backend logout if user explicitly logs out and token exists
            await appAuthService.logout(); // Assumes appAuthService.logout handles API call if any
          }
        } catch (err: any) {
          console.error('Logout API call failed:', err);
          // Proceed with frontend logout regardless of backend call success
        } finally {
          set({
            isAuthenticated: false,
            user: null,
            token: null, // Setting token to null triggers persist to remove it
            isLoading: false,
            error: null,
          });
        }
      },

      loadSessionAction: async () => {
        const tokenFromStore = get().token; // Token rehydrated by persist middleware
        if (tokenFromStore) {
          set({ isLoading: true, error: null }); // Indicate loading while validating token
          try {
            // Ensure axiosInstance used by appAuthService has the token from this store's rehydrated state.
            // The axios interceptor currently reads from localStorage directly.
            // For Zustand, it's better if interceptor reads from useUserSessionStore.getState().token
            // OR if loadSessionAction explicitly sets the token for axiosInstance before this call.
            // For now, assume interceptor gets the rehydrated token.
            const currentUser = await appAuthService.getCurrentUser();
            set({
              isAuthenticated: true,
              user: currentUser,
              token: tokenFromStore, // Ensure token from store is reaffirmed
              isLoading: false,
            });
          } catch (err: any) {
            set({ // Clear session if token validation fails
              isAuthenticated: false,
              user: null,
              token: null, // This will also clear it from localStorage via persist
              isLoading: false,
              error: 'Session expired or token invalid. Please log in again.',
            });
          }
        } else {
          // No token found, ensure clean state
          set({ isAuthenticated: false, user: null, token: null, isLoading: false, error: null });
        }
      },
    }),
    {
      name: APP_AUTH_TOKEN_STORAGE_KEY_FOR_STORE, // localStorage key for the persisted state
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }), // Only persist the token
      onRehydrateStorage: (state) => {
        console.log('App frontend auth store rehydrated');
        // Can trigger loadSessionAction after rehydration if needed,
        // but explicit call in App.tsx useEffect is often more controlled.
        // if (state?.token) {
        //   useUserSessionStore.getState().loadSessionAction();
        // }
      }
    }
  )
);

// Placeholder for appAuthService.ts - this file needs to be created
// It would be similar to the admin's authService.ts but might use different
// User/LoginResponse types if app frontend has different needs or if backend endpoints differ.
// For now, userSessionStore assumes it exists and has login, logout, getCurrentUser.
