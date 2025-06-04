import yaml
import os
import logging
from typing import Dict, Any, List

from open_webui.env import DATA_DIR # Assuming DATA_DIR is correctly set up

log = logging.getLogger(__name__)

# Define DEFAULT_SETTINGS as per the analysis in the previous step
DEFAULT_SETTINGS: Dict[str, Any] = {
    "service": {
        "host": "0.0.0.0",
        "port": 8080,
        "workers": 1,
        "base_url": "", # For reverse proxy path, e.g., /webui
        "data_dir": "./data", # Default, but will be informed by actual DATA_DIR if used for relative paths
        "secret_key": "YOUR_SECRET_KEY_HERE_CHANGE_ME", # Placeholder
        "log_level": "INFO",
        "offline_mode": False,
        "trust_remote_code": False,
    },
    "database": {
        "url": f"sqlite:///{os.path.join(DATA_DIR, 'webui.db')}", # Default uses DATA_DIR
    },
    "auth": { # Corresponds to some PersistentConfig paths like "auth.jwt_expiry"
        "enable_auth": True, # This might be a direct os.environ check in env.py (WEBUI_AUTH)
        # enable_signup is under "ui.enable_signup" for PersistentConfig
        # default_user_role is under "ui.default_user_role" for PersistentConfig
        "jwt_expires_in_minutes": -1,
        "oauth": { # Corresponds to PersistentConfig paths like "oauth.enable_signup"
            "enabled": False, # General switch for all OAuth
            "enable_signup": False, # Specifically for OAuth registration
            "providers": {
                "google": {"enabled": False, "client_id": "", "client_secret": "", "redirect_uri": ""},
                # Add other providers like github, microsoft, oidc with similar structure
            }
        },
        "ldap": {
            "enabled": False,
            # Add other LDAP fields like host, port, base_dn as needed
        }
    },
    "ui": { # New top-level key to match PersistentConfig paths like "ui.enable_signup"
        "enable_signup": True, # Moved from auth.enable_signup
        "default_user_role": "pending", # Moved from auth.default_user_role
        "default_locale": "", # From original DEFAULT_CONFIG in config.py
        "prompt_suggestions": [], # Placeholder, default is complex
        "default_models": None, # Placeholder, from original DEFAULT_CONFIG
        "enable_community_sharing": True, # Example
        "enable_message_rating": True, # Example
        # model_order_list can also go here
    },
    "webui": { # New top-level key for PersistentConfig path "webui.url"
        "url": "http://localhost:3000", # Example
    },
    "frontend_branding": { # This remains for branding specific, non-PersistentConfig items initially
        "app_name": "Open WebUI",
        "app_title": "Open WebUI", # Will also be set by SYSTEM_SETTINGS['app_title'] to app.title
        "logo_path": "/static/logo.png",
        "favicon_path": "/static/favicon.png",
        "splash_path": "/static/splash.png",
        "login_slogan": "Welcome to your personalized WebUI",
        "footer_text": "Powered by Open WebUI",
        "enable_update_check": True,
        "custom_links": [], # List of {"text": "Example", "url": "https://example.com"}
        "meta_tags": {"description": "An open-source WebUI for LLMs.", "keywords": "AI, LLM, WebUI"},
        "ui_theme": {"primary_color": None, "secondary_color": None, "font_family": None},
        "announcement_banner": {"enabled": False, "text": "", "type": "info", "dismissible": True}
    },
    # LLM services structure should align with PersistentConfig paths if they manage these
    # e.g., ollama.base_urls, openai.api_keys etc.
    "ollama": { # Top-level key "ollama" to match PersistentConfig "ollama.*"
        "enable": True, # Corresponds to ENABLE_OLLAMA_API ("ollama.enable")
        "base_urls": ["http://localhost:11434"], # Corresponds to OLLAMA_BASE_URLS ("ollama.base_urls")
        # api_configs would be "ollama.api_configs"
    },
    "openai": { # Top-level key "openai" to match PersistentConfig "openai.*"
        "enable": True, # Corresponds to ENABLE_OPENAI_API ("openai.enable")
        "api_base_urls": [], # Corresponds to OPENAI_API_BASE_URLS ("openai.api_base_urls")
        "api_keys": [],      # Corresponds to OPENAI_API_KEYS ("openai.api_keys")
        # api_configs would be "openai.api_configs"
    },
    "rag": { # For RAG settings, paths like "rag.chunk_size"
        "embedding_engine": "sentence-transformers", # RAG_EMBEDDING_ENGINE ("rag.embedding_engine")
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2", # RAG_EMBEDDING_MODEL ("rag.embedding_model")
        "embedding_batch_size": 32, # RAG_EMBEDDING_BATCH_SIZE ("rag.embedding_batch_size")
        "reranking_model": "", # RAG_RERANKING_MODEL ("rag.reranking_model")
        "vector_db": "chroma", # VECTOR_DB (env only, not PersistentConfig) -> this might need special handling or stay env-only
        "chroma_path": f"{os.path.join(DATA_DIR, 'vector_db', 'chroma')}", # CHROMA_DATA_PATH (env only)
        "chunk_size": 1000, # CHUNK_SIZE ("rag.chunk_size")
        "chunk_overlap": 100, # CHUNK_OVERLAP ("rag.chunk_overlap")
        "pdf_extract_images": False, # PDF_EXTRACT_IMAGES ("rag.pdf_extract_images")
        "template": """### Task: ... (default RAG template from config.py) ...""", # RAG_TEMPLATE ("rag.template")
        "web": { # For web search settings, paths like "rag.web.search.enable"
            "search": {
                "enable": False, # ENABLE_WEB_SEARCH ("rag.web.search.enable")
                "engine": "searxng", # WEB_SEARCH_ENGINE ("rag.web.search.engine")
                "result_count": 3, # WEB_SEARCH_RESULT_COUNT ("rag.web.search.result_count")
            }
        }
    },
    "huggingface": { # These are direct env vars, not PersistentConfig
        "cache_dir": os.path.expanduser("~/.cache/huggingface/hub"),
        "token": "", # Sensitive
        "offline_mode": False,
    },
    "static_serving": { # Optional, for advanced static file path overrides
        "static_dir_override": "",
        "frontend_build_dir_override": ""
    }
}
# Populate RAG default_template from existing config default if possible, or keep placeholder
from open_webui.config import DEFAULT_RAG_TEMPLATE as RAG_PROMPT_TEMPLATE_DEFAULT
DEFAULT_SETTINGS["rag"]["default_template"] = RAG_PROMPT_TEMPLATE_DEFAULT


def deep_merge_dicts(source: dict, destination: dict) -> dict:
    """
    Recursively merges source dict into destination dict.
    Nested dictionaries are merged, otherwise source value overwrites destination.
    """
    for key, value in source.items():
        if isinstance(value, dict) and key in destination and isinstance(destination[key], dict):
            deep_merge_dicts(value, destination[key])
        else:
            destination[key] = value
    return destination

def load_settings_config(config_file_path_override: Optional[str] = None) -> Dict[str, Any]:
    """
    Loads system configuration from a YAML file.
    Prioritizes paths: override > root dir > DATA_DIR.
    Merges loaded config with DEFAULT_SETTINGS.
    """
    potential_paths = []
    if config_file_path_override:
        potential_paths.append(config_file_path_override)

    # Project root directory (assuming this script is in core/, so ../../)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    potential_paths.append(os.path.join(project_root, "settings_config.yaml"))

    # DATA_DIR
    potential_paths.append(os.path.join(DATA_DIR, "settings_config.yaml"))

    config_to_load = None
    for path_to_try in potential_paths:
        if os.path.exists(path_to_try):
            config_to_load = path_to_try
            log.info(f"Using settings configuration file: {config_to_load}")
            break

    final_config = DEFAULT_SETTINGS.copy() # Start with defaults

    if config_to_load:
        try:
            with open(config_to_load, 'r', encoding='utf-8') as f:
                user_config = yaml.safe_load(f)
            if user_config and isinstance(user_config, dict):
                final_config = deep_merge_dicts(user_config, final_config)
                log.info(f"Successfully loaded and merged settings from {config_to_load}")
            elif user_config is None: # Empty file
                log.info(f"Settings file {config_to_load} is empty. Using default settings.")
            else: # File is not a dictionary (e.g. just a string or list)
                log.warning(f"Invalid format in {config_to_load}. Expected a dictionary. Using default settings.")
        except yaml.YAMLError as e:
            log.error(f"Error parsing YAML from {config_to_load}: {e}. Using default settings.")
        except Exception as e:
            log.error(f"Error reading {config_to_load}: {e}. Using default settings.")
    else:
        log.info("No settings_config.yaml found in potential paths. Using default settings.")
        # Check if a settings_config.yaml.example exists in root and suggest copying
        example_path = os.path.join(project_root, "settings_config.yaml.example")
        if os.path.exists(example_path):
            log.info(f"An example configuration file can be found at {example_path}. Consider copying it to settings_config.yaml and customizing.")

    # Post-processing or validation can be added here if needed
    # Example: ensure data_dir is absolute or resolved correctly if relative paths were used in YAML
    # For now, assuming paths like data_dir in YAML are handled by user or subsequent logic.
    # The default for database.url and rag.vector_db.chroma_path already use DATA_DIR from env.
    # If user specifies data_dir in YAML, these might need dynamic updates if they were intended to be relative to it.
    # For simplicity, current DEFAULT_SETTINGS uses DATA_DIR directly from env for those paths.
    # If `service.data_dir` from YAML is to override `env.DATA_DIR`'s use, that needs more complex handling.
    # Let's assume `service.data_dir` in YAML is the source of truth for where data *should* go,
    # and `env.DATA_DIR` is where it *currently* goes based on env/defaults.
    # A common pattern is to resolve `data_dir` early and then use its absolute path.

    # Resolve service.data_dir to an absolute path. If it's relative, assume relative to project root.
    # This is important if other paths (like sqlite DB) are defined *relative* to data_dir in the YAML.
    service_data_dir = final_config.get("service", {}).get("data_dir", DEFAULT_SETTINGS["service"]["data_dir"])
    if not os.path.isabs(service_data_dir):
        final_config["service"]["data_dir"] = os.path.abspath(os.path.join(project_root, service_data_dir))

    # Ensure critical keys like secret_key are handled (e.g., warning if still default)
    if final_config.get("service", {}).get("secret_key") == "YOUR_SECRET_KEY_HERE_CHANGE_ME":
        log.warning("CRITICAL: Default 'service.secret_key' is in use. Please change it in your settings_config.yaml for security.")
        # In a production system, you might even prevent startup or generate a temporary one.

    return final_config
