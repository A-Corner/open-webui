import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { readable, writable } from 'svelte/store';
import Sidebar from './Sidebar.svelte'; // Adjust path as needed
import type { BrandingConfig } from '$lib/stores/brandingStore';
import type { User } from '$lib/types';

// Default mock branding config
const mockBrandingConfigDefault: BrandingConfig = {
  app_name: 'TestApp',
  app_title: 'Test App Title',
  logo_path: '/custom_logo.png',
  favicon_path: '/custom_favicon.png',
  splash_path: '/custom_splash.png',
  login_slogan: 'Welcome Slogan',
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
vi.mock('$lib/stores', async () => {
  const originalStores = await vi.importActual('$lib/stores');
  return {
    ...originalStores,
    user: writable<User | null>({ id: 'testuser', name: 'Test User', role: 'admin', email: 'test@test.com', profile_image_url:'/avatar.png', api_key:'' }),
    chats: writable([]),
    settings: writable({}),
    showSidebar: writable(true),
    mobile: readable(false),
    showArchivedChats: writable(false),
    pinnedChats: writable([]),
    scrollPaginationEnabled: writable(false),
    currentChatPage: writable(1),
    temporaryChatEnabled: writable(false),
    channels: writable([]),
    socket: writable(null),
    config: readable({ features: { enable_channels: true } }), // Mock parts of config used by Sidebar
    isApp: readable(false),
    finalBrandingStore: readable({ config: mockBrandingConfigDefault, error: null, isLoading: false, version: 'test' })
  };
});

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// Mock child components to simplify testing if they are complex or irrelevant to this test's focus
vi.mock('$lib/components/layout/Sidebar/ArchivedChatsModal.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/layout/Sidebar/UserMenu.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/layout/Sidebar/ChatItem.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/common/Spinner.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/common/Loader.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/layout/Sidebar/SearchInput.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/common/Folder.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/layout/Sidebar/Folders.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/layout/Sidebar/ChannelModal.svelte', () => ({ default: vi.fn() }));
vi.mock('$lib/components/layout/Sidebar/ChannelItem.svelte', () => ({ default: vi.fn() }));


describe('Sidebar Component with Branding', () => {
  beforeEach(() => {
    // Reset any necessary states or mocks
    document.body.innerHTML = ''; // Clear previous renders
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the logo from branding config', async () => {
    render(Sidebar);
    // The logo is inside the "New Chat" button link
    const logoImg = screen.getByAltText(mockBrandingConfigDefault.app_name) as HTMLImageElement;
    expect(logoImg).not.toBeNull();
    // Check if the src attribute contains the configured logo_path.
    // For relative paths, browser might resolve it to full URL.
    expect(logoImg.src).toContain(mockBrandingConfigDefault.logo_path);
  });

  it('renders the app name in "New Chat" button text from branding config', async () => {
    render(Sidebar);
    // The text combines "New Chat in" with the app name.
    // We use a regex to find part of the text because of i18n.
    const newChatButtonText = screen.getByText((content, element) => {
        // Check if the element is part of the "New Chat" button area
        // and if its text content contains the app name from branding.
        // This is a bit loose due to potential i18n formatting.
        return content.includes(mockBrandingConfigDefault.app_name) && content.startsWith(mockI18n.t('New Chat in'));
    });
    expect(newChatButtonText).not.toBeNull();
  });

  it('falls back to default logo if branding logo_path is null/empty', async () => {
    // Override the store for this specific test
    const mockStores = await vi.importActual('$lib/stores');
    mockStores.finalBrandingStore.set({ config: { ...mockBrandingConfigDefault, logo_path: '' }, error: null, isLoading: false, version: 'test' });

    render(Sidebar);
    const logoImg = screen.getByAltText('Logo') as HTMLImageElement; // Fallback alt text might be "Logo"
    expect(logoImg).not.toBeNull();
    expect(logoImg.src).toContain('/static/favicon.png'); // Check for default/fallback src
  });

});
