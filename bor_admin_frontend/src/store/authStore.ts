import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import authService, { type User, type LoginResponse } from '../api/authService'; // Adjust path as needed

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  loginAction: (credentials: { username_or_email: string; password: string }) => Promise<void>;
  logoutAction: (isUserInitiated?: boolean) => Promise<void>;
  loadUserAction: () => Promise<void>; // To load user from stored token on app init
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// const AUTH_TOKEN_STORAGE_KEY = 'admin_auth_token'; // Not needed if persist middleware handles the token

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null, // This will be automatically rehydrated from localStorage by persist middleware
      isLoading: false,
      error: null,

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      loginAction: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response: LoginResponse = await authService.login(credentials);
          const { access_token, user } = response;

          // persist middleware will automatically save the token if it's part of the persisted state
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
            token: null,
            isLoading: false,
            error: errorMessage,
          });
          // persist middleware handles token removal if token is set to null
          throw new Error(errorMessage); // Re-throw for component to handle
        }
      },

      logoutAction: async (isUserInitiated = true) => {
        set({ isLoading: true });
        try {
          if (isUserInitiated) {
            await authService.logout(); // Calls API, which might be frontend only (clears its own cookie/storage if any)
          }
        } catch (err: any) {
          console.error('Logout API call failed:', err);
        } finally {
          // Setting token to null will trigger persist middleware to remove it from localStorage
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
            error: null,
          });
          // Optionally, redirect to login page here or let router handle it
          // if (isUserInitiated && window.location.pathname !== '/login') {
          //   window.location.href = '/login';
          // }
        }
      },

      loadUserAction: async () => {
        const tokenFromStore = get().token; // Get token rehydrated by persist middleware
        if (tokenFromStore) {
          set({ isLoading: true }); // No need to set token again, already rehydrated
          try {
            const currentUser = await authService.getCurrentUser(); // getCurrentUser uses token from axios interceptor which reads from store/localStorage
            set({
              isAuthenticated: true,
              user: currentUser,
              isLoading: false,
              error: null,
            });
          } catch (err: any) {
            // Token likely invalid or expired. Clear it.
            set({
              isAuthenticated: false,
              user: null,
              token: null,
              isLoading: false,
              error: 'Session expired or token is invalid.', // Could be more specific
            });
             // Do not throw error here, as this is a background load attempt.
             // Let UI decide how to react (e.g. redirect via PrivateRoute).
          }
        } else {
          set({ isAuthenticated: false, user: null, token: null, isLoading: false });
        }
      },
    }),
    {
      name: 'bor-admin-auth', // Name for localStorage key by persist middleware
      storage: createJSONStorage(() => localStorage), // Use localStorage
      partialize: (state) => ({ token: state.token }), // Only persist the token
      // onRehydrateStorage: (state) => { // Not needed if loadUserAction called explicitly
      //   console.log('Auth store rehydrated');
      //   return (state, error) => {
      //     if (error) {
      //       console.error('Error rehydrating auth store:', error);
      //     }
      //     // if (state && state.token) {
      //     //   // Trigger user load if token found on rehydration
      //     //   // This might be too early or race with explicit loadUserAction
      //     //   // useAuthStore.getState().loadUserAction();
      //     // }
      //   };
      // },
    }
  )
);

// Call loadUserAction once when the store module is first imported/loaded by the app.
// This ensures that on app refresh, we try to restore login state.
// However, this might be too early for some test environments or SSR.
// It's often better to call this explicitly in the main App component or root layout.
// For now, I'll leave it here but comment it out, to be called in App.tsx or similar.
// useAuthStore.getState().loadUserAction();
