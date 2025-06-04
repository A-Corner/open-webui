import json
import os
from typing import Dict, Any, List, Optional

from open_webui.env import log # DATA_DIR is no longer used here
from typing import Dict, Any, Optional # Ensure Optional is imported

# DEFAULT_BRANDING_CONFIG remains the same
DEFAULT_BRANDING_CONFIG = {
  "app_name": "Open WebUI",
  "app_title": "Open WebUI", # Default title if not set by branding
  "logo_path": "/static/logo.png",
  "favicon_path": "/static/favicon.png",
  "splash_path": "/static/splash.png",
  "login_slogan": "Welcome to your personalized WebUI",
  "footer_text": "Powered by Open WebUI",
  "enable_update_check": True,
  "custom_links": [],
  "meta_tags": {
    "description": "A versatile and customizable web UI for LLMs.",
    "keywords": "webui, llm, ai, open source"
  },
  "ui_theme": { # Adding defaults for theme too
    "primary_color": None, # Example: "#343541"
    "secondary_color": None, # Example: "#40414f"
    "font_family": None # Example: "Arial, sans-serif"
  },
  "announcement_banner": {
    "enabled": False,
    "text": "",
    "type": "info" # info, warning, error
  }
}

# Helper for deep merging, can remain in this file or be moved to a common utils
def deep_merge_dicts(source: dict, destination: dict) -> dict:
    for key, value in source.items():
        if isinstance(value, dict) and key in destination and isinstance(destination[key], dict):
            deep_merge_dicts(value, destination[key])
        else:
            destination[key] = value
    return destination

def load_branding_config_from_settings(user_branding_settings: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Merges user-provided frontend_branding settings (from SYSTEM_SETTINGS) with DEFAULT_BRANDING_CONFIG.
    """
    merged_config = DEFAULT_BRANDING_CONFIG.copy()

    if user_branding_settings and isinstance(user_branding_settings, dict):
        deep_merge_dicts(user_branding_settings, merged_config)
        log.info("Successfully merged frontend_branding settings from system configuration.")
    else:
        log.info("No valid frontend_branding settings found in system configuration, using default branding settings.")

    # Validate types for specific known keys
    if not isinstance(merged_config.get("enable_update_check"), bool):
        log.warning("Invalid type for 'enable_update_check' in frontend_branding settings, defaulting to True.")
        merged_config["enable_update_check"] = DEFAULT_BRANDING_CONFIG["enable_update_check"]

    if not isinstance(merged_config.get("custom_links"), list):
        log.warning("Invalid type for 'custom_links' in frontend_branding settings, defaulting to empty list.")
        merged_config["custom_links"] = DEFAULT_BRANDING_CONFIG["custom_links"]

    # Ensure nested dicts like meta_tags, ui_theme, announcement_banner exist if partially overridden
    for key in ["meta_tags", "ui_theme", "announcement_banner"]:
        if not isinstance(merged_config.get(key), dict):
            log.warning(f"Invalid or missing '{key}' in frontend_branding, reverting to default for this key.")
            merged_config[key] = DEFAULT_BRANDING_CONFIG[key].copy()
        else:
            # Ensure all sub-keys from default are present if user provided a partial dict
            default_sub_dict = DEFAULT_BRANDING_CONFIG[key].copy()
            user_sub_dict = merged_config[key]
            default_sub_dict.update(user_sub_dict) # User values override defaults
            merged_config[key] = default_sub_dict


    return merged_config

# APP_BRANDING_CONFIG is no longer loaded here at module import.
# It will be initialized in config.py after SYSTEM_SETTINGS is available.
