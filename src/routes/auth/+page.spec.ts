import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { readable, writable } from 'svelte/store';
import AuthPage from './auth/+page.svelte'; // Path to your auth page component
import type { BrandingConfig } from '$lib/stores/brandingStore';
import type { User } from '$lib/types';
import type { Config } from '$lib/types';


// Default mock branding config
const mockBrandingConfigDefault: BrandingConfig = {
  app_name: 'TestApp',
  app_title: 'Test App Title',
  logo_path: '/custom_logo.png',
  favicon_path: '/custom_favicon.png',
  splash_path: '/custom_splash.png',
  login_slogan: 'Welcome to the Test Application!',
  footer_text: 'Footer Text',
  enable_update_check: true,
  custom_links: [],
  meta_tags: {},
  ui_theme: {},
  announcement_banner: { enabled: false, text: '', type: 'info'},
};

// Mock i18n
const mockI18n = {
  t: vi.fn((key: string, params?: any) => `${key}${params ? `:${JSON.stringify(params)}` : ''}`),
};
vi.mock('svelte-i18n', async () => {
    const original = await vi.importActual('svelte-i18n');
    return {
      ...original,
      t: readable(mockI18n.t)
    };
});

// Mock Svelte stores
const mockUserStore = writable<User | null>(null); // No user initially for login page
const mockConfigStoreState: Partial<Config> = { // More complete mock for Config
  features: {
    auth: true,
    auth_trusted_header: false,
    enable_ldap: false,
    enable_api_key: true,
    enable_signup: true,
    enable_login_form: true,
    enable_websocket: true,
  },
  oauth: { providers: {} },
  onboarding: false, // Assume onboarding is false for typical login test
};

vi.mock('$lib/stores', async() => {
  const originalStores = await vi.importActual('$lib/stores');
  return {
    ...originalStores,
    user: mockUserStore,
    config: readable(mockConfigStoreState), // Use a more defined config state
    finalBrandingStore: readable({ config: mockBrandingConfigDefault, error: null, isLoading: false, version: 'test' }),
    WEBUI_NAME: readable(mockBrandingConfigDefault.app_name), // Make WEBUI_NAME consistent with branding
    socket: writable(null)
  };
});

// Mock $app/navigation and $app/stores
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));
vi.mock('$app/stores', () => ({
  page: readable({ url: new URL("http://localhost/auth"), hash: '' }) // Mock page store with hash property
}));


// Mock child components
vi.mock('$lib/components/common/Spinner.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/OnBoarding.svelte', () => ({ default: vi.fn() }));

// Mock APIs
vi.mock('$lib/apis/auths', () => ({
  ldapUserSignIn: vi.fn(),
  getSessionUser: vi.fn(),
  userSignIn: vi.fn(),
  userSignUp: vi.fn()
}));
vi.mock('$lib/apis', () => ({
    getBackendConfig: vi.fn().mockResolvedValue(mockConfigStoreState)
}));


describe('Auth Page (/auth/+page.svelte) with Branding', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
    // Reset user store if needed for specific tests, e.g. redirect if user exists
    mockUserStore.set(null);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('displays the login slogan from branding config', async () => {
    render(AuthPage);
    // Wait for onMount and store subscriptions
    await new Promise(resolve => setTimeout(resolve, 0));

    const sloganElement = screen.getByText(mockBrandingConfigDefault.login_slogan);
    expect(sloganElement).not.toBeNull();
    // Check if it's reasonably visible (e.g., not inside a hidden parent by default)
    expect(sloganElement.offsetParent).not.toBeNull();
  });

  it('displays app_name in titles/headings', async () => {
    render(AuthPage);
    await new Promise(resolve => setTimeout(resolve, 0));

    // Example: "Sign in to TestApp"
    // The i18n mock will produce: "Sign in to {{WEBUI_NAME}}:{\"WEBUI_NAME\":\"TestApp\"}"
    // We need to find text that contains the app name.
    const headingElement = screen.getByText((content, element) => {
        return content.includes(mockBrandingConfigDefault.app_name) && element.classList.contains('font-medium');
    });
    expect(headingElement).not.toBeNull();
  });

  // Add more tests for other branding elements if they were on this page,
  // or for different modes (signin, signup, ldap) to ensure slogan appears.
});
