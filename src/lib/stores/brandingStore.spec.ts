import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { finalBrandingStore, type BrandingStore } from './brandingStore'; // Adjust path
import * as brandingAPI from '$lib/apis/branding'; // To mock getBrandingConfig
import type { BrandingConfig } from '$lib/apis/branding';
import { get } from 'svelte/store'; // To get store value for assertions

// Mock the API module
vi.mock('$lib/apis/branding');

// Mock PUBLIC_VERSION from $env/static/public
vi.mock('$env/static/public', () => ({
  PUBLIC_VERSION: 'test-version-123',
}));


describe('Branding Store (finalBrandingStore)', () => {
  let mockGetBrandingConfig: vi.SpyInstance;

  beforeEach(() => {
    // Reset mocks before each test
    mockGetBrandingConfig = vi.spyOn(brandingAPI, 'getBrandingConfig');

    // Reset the store to a clean state if possible.
    // Svelte stores created with writable don't have a built-in reset,
    // but we can re-initialize or set them to an initial state if the store export allows it.
    // Since finalBrandingStore is created on module load and immediately fetches,
    // re-importing or resetting module state (e.g. vi.resetModules) would be needed for true isolation.
    // For now, we'll test its behavior based on API mock responses.
    // Each test relying on initial fetch should mock the API then potentially re-trigger fetch or observe.
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore original implementations
  });

  it('initializes with loading state and fetches config', async () => {
    const mockConfigData: BrandingConfig = {
      app_name: 'Initial App', app_title: 'Initial Title', logo_path: '/logo.png',
      favicon_path: '/favicon.png', splash_path: '/splash.png', login_slogan: 'Hi',
      footer_text: 'Footer', enable_update_check: true, custom_links: [],
      meta_tags: {}, ui_theme: {}, announcement_banner: {enabled: false, text:"", type:"info"}
    };
    mockGetBrandingConfig.mockResolvedValue(mockConfigData);

    // The store fetches on initialization. We need to wait for this to complete.
    // The store is module-level, so its first fetch might happen when imported.
    // To test initial state reliably, reset modules or test effects of re-fetch.

    // Let's get the store's current state. It might have already fetched.
    let storeValue = get(finalBrandingStore);

    // If the fetch on import already completed, isLoading might be false.
    // We can call retryFetch to simulate a fresh load for this test's purpose.
    if (!storeValue.isLoading && storeValue.config === mockConfigData) {
        // Already loaded, this is fine, means initial fetch worked.
    } else {
        // If it was loading or had an error from a previous (hypothetical) test in same module context
        // Or if we want to explicitly test the fetch sequence again:
        finalBrandingStore.retryFetch(); // Assuming this sets isLoading = true initially

        // Wait for promises to resolve from retryFetch
        await new Promise(resolve => setTimeout(resolve, 0));
        storeValue = get(finalBrandingStore);
    }

    expect(storeValue.isLoading).toBe(false);
    expect(storeValue.config).toEqual(mockConfigData);
    expect(storeValue.error).toBeNull();
    expect(mockGetBrandingConfig).toHaveBeenCalledTimes(1); // Or more if module already loaded it.
  });

  it('handles API error during fetch', async () => {
    const apiError = new Error('API Fetch Error');
    mockGetBrandingConfig.mockRejectedValue(apiError);

    // Call retryFetch to ensure we trigger the fetch with this mock
    finalBrandingStore.retryFetch();

    // Wait for promises to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    const storeValue = get(finalBrandingStore);

    expect(storeValue.isLoading).toBe(false);
    expect(storeValue.config).toBeNull(); // Or initialBrandingState
    expect(storeValue.error).toEqual(apiError);
  });

  it('updates isLoading state correctly during fetch', async () => {
    mockGetBrandingConfig.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({} as BrandingConfig), 50))
    );

    finalBrandingStore.retryFetch();
    let storeValue = get(finalBrandingStore);
    expect(storeValue.isLoading).toBe(true); // Should be true immediately after fetch starts

    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for fetch to complete
    storeValue = get(finalBrandingStore);
    expect(storeValue.isLoading).toBe(false); // Should be false after fetch completes
  });

  it('stores PUBLIC_VERSION correctly', () => {
    // This test assumes PUBLIC_VERSION is mocked via vi.mock('$env/static/public')
    const storeValue = get(finalBrandingStore);
    expect(storeValue.version).toBe('test-version-123');
  });

});
