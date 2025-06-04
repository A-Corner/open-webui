import json
import os
from typing import Dict, Any, List, Optional

from open_webui.env import DATA_DIR, log

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

def load_branding_config() -> Dict[str, Any]:
    """
    Loads branding configuration from branding_config.json.
    Falls back to default values if the file is not found or is invalid.
    """
    config_file_path = os.path.join(DATA_DIR, "branding_config.json")
    loaded_config = {}

    if os.path.exists(config_file_path):
        try:
            with open(config_file_path, 'r', encoding='utf-8') as f:
                loaded_config = json.load(f)
            log.info(f"Successfully loaded branding configuration from {config_file_path}")
        except json.JSONDecodeError as e:
            log.error(f"Error decoding JSON from {config_file_path}: {e}. Using default branding.")
            return DEFAULT_BRANDING_CONFIG
        except Exception as e:
            log.error(f"Error reading {config_file_path}: {e}. Using default branding.")
            return DEFAULT_BRANDING_CONFIG
    else:
        log.info(f"Branding configuration file not found at {config_file_path}. Using default branding.")
        return DEFAULT_BRANDING_CONFIG

    # Merge loaded config with defaults to ensure all keys are present
    # This allows users to only override parts of the config.
    # A deep merge might be better for nested dicts like meta_tags, ui_theme, announcement_banner

    merged_config = DEFAULT_BRANDING_CONFIG.copy()

    def deep_update(target: Dict, source: Dict):
        for key, value in source.items():
            if isinstance(value, dict) and key in target and isinstance(target[key], dict):
                deep_update(target[key], value)
            else:
                target[key] = value

    deep_update(merged_config, loaded_config)

    # Validate types for specific known keys if necessary, or rely on consumer.
    # For example, ensure 'enable_update_check' is a boolean.
    if not isinstance(merged_config.get("enable_update_check"), bool):
        log.warning("Invalid type for 'enable_update_check' in branding_config.json, defaulting to True.")
        merged_config["enable_update_check"] = DEFAULT_BRANDING_CONFIG["enable_update_check"]

    if not isinstance(merged_config.get("custom_links"), list):
        log.warning("Invalid type for 'custom_links' in branding_config.json, defaulting to empty list.")
        merged_config["custom_links"] = DEFAULT_BRANDING_CONFIG["custom_links"]

    return merged_config

# Load it once on module import
APP_BRANDING_CONFIG = load_branding_config()
