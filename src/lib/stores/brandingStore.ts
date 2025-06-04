import { writable, type Writable } from 'svelte/store';
import { getBrandingConfig, type BrandingConfig } from '$lib/apis/branding';
import { PUBLIC_VERSION } from '$env/static/public'; // For cache busting if needed

export interface BrandingStore {
  config: BrandingConfig | null;
  error: Error | null;
  isLoading: boolean;
  version: string; // To store app version for potential cache busting or display
}

const initialBrandingState: BrandingConfig | null = null; // Default to null, fetched on load

const createBrandingStore = () => {
  const { subscribe, set, update }: Writable<BrandingStore> = writable({
    config: initialBrandingState,
    error: null,
    isLoading: true, // Start in loading state
    version: PUBLIC_VERSION
  });

  async function fetchConfig() {
    update(store => ({ ...store, isLoading: true, error: null }));
    try {
      const brandingData = await getBrandingConfig();
      set({ config: brandingData, error: null, isLoading: false, version: PUBLIC_VERSION });
    } catch (err: any) {
      console.error("Error loading branding configuration:", err);
      // In case of error, we might want to set some very basic defaults
      // or leave config as null and let components handle it.
      // For now, setting error and keeping config potentially null or with last known good.
      set({ config: initialBrandingState, error: err, isLoading: false, version: PUBLIC_VERSION });
    }
  }

  // Fetch config immediately when store is created/initialized
  // This happens typically once when the app loads and store is imported.
  fetchConfig();

  return {
    subscribe,
    fetchConfig, // Expose refetch if needed, e.g., for a manual refresh button
    // Potentially add getters for specific config values if direct access is too verbose for components
    getAppName: () => {
        let appName = 'Open WebUI'; // Ultimate fallback
        subscribe(store => { // Access store value
            if (store.config && store.config.app_name) {
                appName = store.config.app_name;
            }
        })(); // Immediately invoke to get the value
        return appName;
    }
  };
};

export const brandingStore = createBrandingStore();

// Example of how to use a specific value with fallback in a component:
// import { brandingStore } from '$lib/stores/brandingStore';
// $: appTitle = $brandingStore.config?.app_title || 'Default App Title';
// $: logoPath = $brandingStore.config?.logo_path || '/static/default_logo.png';

// The getAppName is an example of a derived store or getter, usually not needed
// if components subscribe directly or use $: syntax.
// It's more common to export the store and let components handle the subscription.
// For instance, a component would do:
//
// <script>
//   import { brandingStore } from '$lib/stores/brandingStore';
// </script>
//
// <title>{$brandingStore.config?.app_title || 'Loading...'}</title>
//
// This ensures reactivity. The getAppName above is not reactive in the Svelte sense
// if used as `brandingStore.getAppName()` in markup.
// It's better for components to subscribe: `$: appName = $brandingStore.config?.app_name;`
// For now, I will remove the getAppName getter from the store itself to promote direct subscription.
// The store will primarily hold the config object, loading, and error states.

const createFinalBrandingStore = () => {
  const { subscribe, set, update }: Writable<BrandingStore> = writable({
    config: initialBrandingState,
    error: null,
    isLoading: true,
    version: PUBLIC_VERSION
  });

  async function fetchConfig() {
    update(store => ({ ...store, isLoading: true, error: null }));
    try {
      const brandingData = await getBrandingConfig();
      set({ config: brandingData, error: null, isLoading: false, version: PUBLIC_VERSION });
    } catch (err: any) {
      console.error("Error loading branding configuration:", err);
      set({ config: initialBrandingState, error: err, isLoading: false, version: PUBLIC_VERSION });
    }
  }
  fetchConfig(); // Initial fetch

  return {
    subscribe,
    retryFetch: fetchConfig // Allow components to trigger a retry if needed
  };
};
export const finalBrandingStore = createFinalBrandingStore();
