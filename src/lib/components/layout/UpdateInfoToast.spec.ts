import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte';
import { readable, writable } from 'svelte/store';
import UpdateInfoToast from './UpdateInfoToast.svelte'; // Adjust path
import type { BrandingConfig } from '$lib/stores/brandingStore';

// Mock i18n
const mockI18n = {
  t: vi.fn((key: string, params?: any) => {
    if (params && params.LATEST_VERSION) return `A new version (v${params.LATEST_VERSION}) is now available.`;
    if (key === 'Update for the latest features and improvements.') return 'Update for the latest features and improvements.';
    return key;
  }),
};
vi.mock('svelte-i18n', async () => {
    const original = await vi.importActual('svelte-i18n');
    return {
      ...original,
      getContext: () => ({ t: mockI18n.t }) // Mock getContext to return our t function
    };
});

// Mock constants
vi.mock('$lib/constants', () => ({
  WEBUI_VERSION: '0.5.0'
}));

// Mock Svelte stores
const mockBrandingStore = writable({
  config: null as BrandingConfig | null,
  error: null,
  isLoading: false,
  version: 'test'
});

vi.mock('$lib/stores/brandingStore', () => ({
  finalBrandingStore: mockBrandingStore
}));


describe('UpdateInfoToast Component', () => {
  const testVersion = { current: '0.5.0', latest: '0.6.0' };

  beforeEach(() => {
    document.body.innerHTML = '';
    // Reset store to a default state for each test
    mockBrandingStore.set({
      config: {
        app_name: 'TestApp',
        app_title: 'Test App Title',
        logo_path: '/logo.png',
        favicon_path: '/favicon.png',
        splash_path: '/splash.png',
        login_slogan: '',
        footer_text: '',
        enable_update_check: true, // Default to true for most tests
        custom_links: [],
        meta_tags: {},
        ui_theme: {},
        announcement_banner: {enabled: false, text:"", type:"info"}
      },
      error: null,
      isLoading: false,
      version: 'test'
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders toast content when enable_update_check is true', async () => {
    render(UpdateInfoToast, { props: { version: testVersion } });

    // Check for the main text part
    expect(screen.getByText(`A new version (v${testVersion.latest}) is now available.`)).not.toBeNull();
    // Check for the link text
    expect(screen.getByText('Update for the latest features and improvements.')).not.toBeNull();
    // Check if the link itself is present and correct
    const link = screen.getByRole('link') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.href).toBe('https://github.com/open-webui/open-webui/releases');
  });

  it('does not render toast content when enable_update_check is false', async () => {
    mockBrandingStore.update(s => ({
      ...s,
      config: s.config ? { ...s.config, enable_update_check: false } : null
    }));

    const { container } = render(UpdateInfoToast, { props: { version: testVersion } });

    // The component should render nothing, or an empty container
    // Check if the main div rendered by the component is not in the DOM or is empty
    const mainDiv = container.querySelector('.flex.items-start'); // A class from the component's root div
    expect(mainDiv).toBeNull();
  });

  it('dispatches close event when close button is clicked', async () => {
    const { component } = render(UpdateInfoToast, { props: { version: testVersion } });
    const closeEventCallback = vi.fn();
    component.$on('close', closeEventCallback);

    const closeButton = screen.getByRole('button'); // Assuming the XMark is the only button
    await fireEvent.click(closeButton);

    expect(closeEventCallback).toHaveBeenCalledTimes(1);
  });

  it('renders correctly with specific version props', () => {
    const specificVersion = { current: '1.0.0', latest: '1.1.0' };
    render(UpdateInfoToast, { props: { version: specificVersion } });
    expect(screen.getByText(`A new version (v1.1.0) is now available.`)).not.toBeNull();
  });
});
