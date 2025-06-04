import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { readable, writable } from 'svelte/store';
import Layout from './+layout.svelte'; // Path to your layout component
import type { BrandingConfig } from '$lib/stores/brandingStore';
import type { User } from '$lib/types'; // Assuming User type is defined

// Mock Svelte stores
const mockBrandingConfigDefault: BrandingConfig = {
  app_name: 'Test App',
  app_title: 'Test App Title',
  logo_path: '/test_logo.png',
  favicon_path: '/test_favicon.png',
  splash_path: '/test_splash.png',
  login_slogan: 'Welcome Test',
  footer_text: 'Test Footer Inc.',
  enable_update_check: true,
  custom_links: [{ text: 'Test Link', url: 'http://test.com' }],
  meta_tags: { description: 'Test description', keywords: 'test,keywords' },
  ui_theme: { primary_color: '#123456', secondary_color: '#abcdef', font_family: 'Arial' },
  announcement_banner: { enabled: true, text: 'Test announcement', type: 'info' },
};

// Mock $env/static/public
vi.mock('$env/static/public', () => ({
  PUBLIC_VERSION: '0.1.0-test'
}));

// Mock i18n
const mockI18n = {
  t: vi.fn((key: string, params?: any) => `${key}${params ? `:${JSON.stringify(params)}` : ''}`), // Simple mock, enhance if needed
  language: 'en-US'
};
vi.mock('svelte-i18n', async () => {
  const original = await vi.importActual('svelte-i18n');
  return {
    ...original,
    getLocaleFromString: vi.fn(() => 'en-US'),
    t: readable(mockI18n.t), // readable store for t
    locale: readable('en-US'), // readable store for locale
    locales: readable(['en-US', 'de-DE']),
    json: readable({})
  };
});

// Mock other necessary stores and context if layout uses them
const mockUserStore = writable<User | null>({ id: 'testuser', name: 'Test User', role: 'admin', email: 'test@test.com', profile_image_url: '', api_key:'' });
const mockSettingsStore = writable({});
const mockConfigStore = writable({ features: { enable_websocket: true }, version: "0.1.0" });
const mockShowSettingsStore = writable(false);
const mockShowChangelogStore = writable(false);
const mockPageStore = readable({ url: new URL("http://localhost"), params: {}, route: { id: null}, data: {}, status:200, error: null, form: null });

vi.mock('$app/stores', () => ({
  page: mockPageStore,
}));

vi.mock('$lib/stores', async() => {
  const original = await vi.importActual('$lib/stores');
  return {
    ...original,
    user: mockUserStore,
    settings: mockSettingsStore,
    config: mockConfigStore,
    finalBrandingStore: readable({ config: mockBrandingConfigDefault, error: null, isLoading: false, version: '0.1.0-test' }),
    showSettings: mockShowSettingsStore,
    showChangelog: mockShowChangelogStore,
    // Mock other stores used by Sidebar or other child components if they cause rendering issues
    chats: writable([]),
    tags: writable([]),
    models: writable([]),
    prompts: writable([]),
    knowledge: writable([]),
    tools: writable([]),
    functions: writable([]),
    banners: writable([]),
    temporaryChatEnabled: writable(false),
    toolServers: writable([]),
    mobile: readable(false),
    showSidebar: writable(true),
    archivedChats: writable([]),
    pinnedChats: writable([]),
    scrollPaginationEnabled: writable(false),
    currentChatPage: writable(1),
    socket: writable(null), // Mock socket if its methods are called during render
    isApp: readable(false),
    activeUserIds: readable([]),
    USAGE_POOL: readable([])
  };
});

// Mock child components that are complex or not relevant to this specific test
vi.mock('$lib/components/layout/Sidebar.svelte', () => ({ default: vi.fn(() => ({ destroy: vi.fn() })) }));
vi.mock('$lib/components/chat/SettingsModal.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/ChangelogModal.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/layout/Overlay/AccountPending.svelte', () => ({ default: vi.fn()}));
vi.mock('$lib/components/layout/UpdateInfoToast.svelte', () => ({ default: vi.fn() }));
vi.mock('svelte-sonner', () => ({ Toaster: vi.fn(), toast: { success: vi.fn(), error: vi.fn() } }));


describe('App Layout Component with Branding', () => {
  beforeEach(() => {
    // Reset mocks or store states if needed, though readable mocks are generally static for the test
    // For writable stores, you can .set() to a known state.
    document.head.innerHTML = ''; // Clear head before each test
  });
  afterEach(() => {
    cleanup();
  });

  it('renders dynamic title from branding config', async () => {
    render(Layout, {
      props: {
        data: {
          user: get(mockUserStore) // Pass user data if layout expects it (common for +layout.server.ts)
        }
      }
    });
    // Wait for store subscription and svelte:head update
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.title).toBe(mockBrandingConfigDefault.app_title);
  });

  it('renders dynamic favicon from branding config', async () => {
    render(Layout, { props: { data: { user: get(mockUserStore) } } });
    await new Promise(resolve => setTimeout(resolve, 0));
    const faviconElement = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    expect(faviconElement).not.toBeNull();
    expect(faviconElement?.href).toContain(mockBrandingConfigDefault.favicon_path);
  });

  it('renders meta tags from branding config', async () => {
    render(Layout, { props: { data: { user: get(mockUserStore) } } });
    await new Promise(resolve => setTimeout(resolve, 0));
    const descriptionTag = document.querySelector("meta[name='description']") as HTMLMetaElement;
    const keywordsTag = document.querySelector("meta[name='keywords']") as HTMLMetaElement;
    const appleTitleTag = document.querySelector("meta[name='apple-mobile-web-app-title']") as HTMLMetaElement;

    expect(descriptionTag).not.toBeNull();
    expect(descriptionTag?.content).toBe(mockBrandingConfigDefault.meta_tags.description);
    expect(keywordsTag).not.toBeNull();
    expect(keywordsTag?.content).toBe(mockBrandingConfigDefault.meta_tags.keywords);
    expect(appleTitleTag).not.toBeNull();
    expect(appleTitleTag?.content).toBe(mockBrandingConfigDefault.app_name);
  });

  it('renders footer text and custom links from branding config', async () => {
    const { container } = render(Layout, { props: { data: { user: get(mockUserStore) } } });
    await new Promise(resolve => setTimeout(resolve, 0));

    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    if (footer) {
      expect(footer.textContent).toContain(mockBrandingConfigDefault.footer_text);
      const links = footer.querySelectorAll('a');
      expect(links.length).toBe(mockBrandingConfigDefault.custom_links.length);
      if (links.length > 0) {
        expect(links[0].textContent).toBe(mockBrandingConfigDefault.custom_links[0].text);
        expect(links[0].href).toBe(mockBrandingConfigDefault.custom_links[0].url);
      }
    }
  });

  it('applies CSS variables for theme from branding config', async () => {
    render(Layout, { props: { data: { user: get(mockUserStore) } } });
    await new Promise(resolve => setTimeout(resolve, 0));

    const styleElement = document.head.querySelector('style');
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || '';
    expect(styleContent).toContain(`--color-primary: ${mockBrandingConfigDefault.ui_theme.primary_color}`);
    expect(styleContent).toContain(`--color-secondary: ${mockBrandingConfigDefault.ui_theme.secondary_color}`);
    expect(styleContent).toContain(`--font-family-sans: ${mockBrandingConfigDefault.ui_theme.font_family}`);
  });

});
