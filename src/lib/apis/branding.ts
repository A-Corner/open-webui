import { WEBUI_API_BASE_URL } from '$lib/constants';

export interface CustomLink {
  text: string;
  url: string;
}

export interface MetaTags {
  description?: string;
  keywords?: string;
}

export interface UITheme {
  primary_color?: string | null;
  secondary_color?: string | null;
  font_family?: string | null;
}

export interface AnnouncementBanner {
  enabled: boolean;
  text: string;
  type: 'info' | 'warning' | 'error';
}

export interface BrandingConfig {
  app_name: string;
  app_title: string;
  logo_path: string;
  favicon_path: string;
  splash_path: string;
  login_slogan: string;
  footer_text: string;
  enable_update_check: boolean;
  custom_links: CustomLink[];
  meta_tags: MetaTags;
  ui_theme: UITheme;
  announcement_banner: AnnouncementBanner;
}

// Variable to cache the config to avoid multiple fetches if not using a store initially
let _brandingConfigCache: BrandingConfig | null = null;

export const getBrandingConfig = async (): Promise<BrandingConfig> => {
  if (_brandingConfigCache) {
    return _brandingConfigCache;
  }

  // This endpoint does not require authentication token
  const response = await fetch(`${WEBUI_API_BASE_URL}/branding/config`);

  if (!response.ok) {
    // Log an error but try to return a default structure or throw less critical error
    // as branding is UI enhancement and shouldn't break the app if fetch fails.
    // However, for initial load, if some values are critical (like paths), this might be an issue.
    // For now, let's throw to indicate a problem during setup.
    console.error('Failed to fetch branding configuration:', response.statusText);
    throw new Error(`Failed to fetch branding configuration: ${response.statusText}`);
  }

  const config = await response.json();
  _brandingConfigCache = config;
  return config;
};

// Function to get a specific branding value with a fallback, useful in components
export const getBrandingValue = <K extends keyof BrandingConfig>(
  key: K,
  defaultValue?: BrandingConfig[K]
): BrandingConfig[K] | undefined => {
  if (_brandingConfigCache && _brandingConfigCache[key] !== undefined) {
    return _brandingConfigCache[key];
  }
  // Attempt to provide a very basic default if essential and not found, though backend defaults should handle this.
  // This is more of a safety net or for direct use where store might not be ready.
  if (defaultValue !== undefined) return defaultValue;

  // Fallback for critical items if not even defaults are passed (though backend should ensure all keys)
  // This part is mostly illustrative as backend defaults should prevent needing this.
  if (key === 'app_name') return 'Open WebUI' as BrandingConfig[K];
  if (key === 'favicon_path') return '/static/favicon.png' as BrandingConfig[K];


  return undefined;
};
