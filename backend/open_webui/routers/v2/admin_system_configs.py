from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Any, Union
from pydantic import BaseModel, Field

from open_webui.config import AppConfig, PersistentConfig, PERSISTENT_CONFIG_REGISTRY, SYSTEM_SETTINGS
from open_webui.utils.auth import get_admin_user
from open_webui.models.users import UserModel as UserSchema # For admin user dependency typing
from open_webui.core.settings_loader import DEFAULT_SETTINGS as YAML_DEFAULT_SETTINGS # To help identify non-sensitive defaults
import logging # Added logging

router = APIRouter()
log = logging.getLogger(__name__) # Added logger instance

# Pydantic Models
ConfigValue = Union[str, int, float, bool, List[Any], Dict[str, Any], None]

class ConfigItem(BaseModel):
    key: str # e.g., "ui.enable_signup", "ollama.base_urls"
    value: ConfigValue

class ConfigUpdateRequest(BaseModel):
    configs: List[ConfigItem]

class ConfigResponse(BaseModel):
    configs: Dict[str, ConfigValue]
    # Could also include metadata like type, description, is_sensitive for each key if desired for frontend
    # For now, just key-value pairs

# Helper to get a flattened dictionary of manageable configs
def get_manageable_configs(app_config: AppConfig, system_settings: Dict[str, Any]) -> Dict[str, ConfigValue]:
    manageable: Dict[str, ConfigValue] = {}

    # Iterate through PersistentConfig instances stored in app_config._state or PERSISTENT_CONFIG_REGISTRY
    # PersistentConfig instances hold the current live value.
    # Their config_path attribute is what we'll use as the key.

    # These paths should align with what the admin UI is designed to manage.
    # We need a predefined list of what is considered "manageable" and "safe" for the admin UI.
    # For now, let's iterate through PERSISTENT_CONFIG_REGISTRY as it contains all of them.
    # We must be careful NOT to expose sensitive items (e.g., those containing API keys directly).
    # The YAML_DEFAULT_SETTINGS can give hints about structure and non-sensitive items.

    # Example: Expose items under 'ui', 'auth' (excluding sensitive parts), 'rag' (excluding keys), 'llm_services' (excluding keys)
    # This list needs careful curation.

    safe_to_expose_prefixes = [
        "ui.", "auth.", "rag.", "ollama.", "openai.", "webui.", "channels.", "evaluation.", "task.", "code_execution.", "code_interpreter.", "image_generation.", "audio."
    ]
    sensitive_keywords_in_path = ["key", "secret", "token", "password", "webhook_url"] # Paths containing these should be excluded or handled carefully

    for pc_instance in PERSISTENT_CONFIG_REGISTRY:
        is_safe = False
        for prefix in safe_to_expose_prefixes:
            if pc_instance.config_path.startswith(prefix):
                is_safe = True
                break

        if not is_safe:
            continue

        is_sensitive = False
        for keyword in sensitive_keywords_in_path:
            if keyword in pc_instance.config_path.lower():
                is_sensitive = True
                break

        if is_sensitive:
            # For now, skip sensitive ones. Later, could return placeholder or type info only.
            manageable[pc_instance.config_path] = "********" # Mask sensitive values
        else:
            manageable[pc_instance.config_path] = pc_instance.value

    # Also add relevant non-PersistentConfig items from SYSTEM_SETTINGS if they are manageable
    # Example: frontend_branding items are not PersistentConfig but come from SYSTEM_SETTINGS
    # We need to be very selective here.
    if "frontend_branding" in system_settings:
        for key, value in system_settings["frontend_branding"].items():
            # Assuming all frontend_branding items are safe to expose their values
            manageable[f"frontend_branding.{key}"] = value

    # Example: service.log_level, service.offline_mode, service.trust_remote_code
    if "service" in system_settings:
        for key in ["log_level", "offline_mode", "trust_remote_code"]:
            if key in system_settings["service"]:
                 manageable[f"service.{key}"] = system_settings["service"][key]

    return manageable


@router.get("", response_model=ConfigResponse)
def get_system_configurations(
    request: Request,
    admin_user: UserSchema = Depends(get_admin_user),
):
    # app.state.config is the AppConfig instance
    # SYSTEM_SETTINGS is the global dict from YAML
    configs = get_manageable_configs(request.app.state.config, SYSTEM_SETTINGS)
    return ConfigResponse(configs=configs)

# PUT endpoint implementation will follow
# Need to refine update_config_item_by_env_name or create a new one that uses config_path
# from open_webui.routers.configs import update_config_item_by_env_name # This was based on env_name
# We need one based on config_path. PersistentConfig instances have config_path.

def update_persistent_config_by_path(config_path: str, new_value: Any) -> bool:
    for pc_instance in PERSISTENT_CONFIG_REGISTRY:
        if pc_instance.config_path == config_path:
            # Type casting logic from previous update_config_item_by_env_name can be reused/adapted here
            original_type = type(pc_instance.env_value) # Base type on original env_value (initial default)
            typed_value = new_value
            try:
                if original_type == bool and not isinstance(new_value, bool):
                    typed_value = str(new_value).lower() in ["true", "1", "yes", "on"]
                elif original_type == int and not isinstance(new_value, int):
                    typed_value = int(new_value)
                elif original_type == float and not isinstance(new_value, float):
                    typed_value = float(new_value)
                elif original_type == list and not isinstance(new_value, list):
                    if isinstance(new_value, str): # Simple comma-separated string to list
                        typed_value = [s.strip() for s in new_value.split(',')]
                    # Else, if it's already a list (from Pydantic), it's fine.
                # Dicts are usually handled well by Pydantic. If new_value is dict, it's fine.

                pc_instance.value = typed_value
                pc_instance.save()
                return True
            except Exception as e:
                logging.error(f"Failed to update config {config_path} with value {new_value}: {e}")
                raise ValueError(f"Invalid value or type for {config_path}. Error: {e}") from e
    return False


@router.put("", response_model=ConfigResponse)
def update_system_configurations(
    request_data: ConfigUpdateRequest,
    request_obj: Request, # To get app.state.config and SYSTEM_SETTINGS
    db: Session = Depends(get_db), # Though PersistentConfig.save() uses its own get_db context
    admin_user: UserSchema = Depends(get_admin_user),
):
    updated_keys = []
    errors = []

    for item in request_data.configs:
        key_path = item.key
        value = item.value

        try:
            # Check if it's a frontend_branding or service config first (not PersistentConfig)
            # This part is tricky: SYSTEM_SETTINGS is loaded from YAML, but not all parts are PersistentConfig.
            # Frontend should only send keys for PersistentConfig items if it wants them to be saved to DB.
            # If we want to allow updating YAML-only settings (like frontend_branding, service.log_level) via API,
            # that would require writing back to settings_config.yaml, which is complex and not typical for web APIs.
            # For now, assume this API primarily updates PersistentConfig items.
            # The GET endpoint can expose more read-only values from SYSTEM_SETTINGS.

            # We should only try to update PersistentConfig items.
            # The key from request should be a config_path of a PersistentConfig.

            updated = update_persistent_config_by_path(key_path, value)
            if updated:
                updated_keys.append(key_path)
            else:
                # This key might not be a PersistentConfig or path is wrong
                # Check if it's one of the direct SYSTEM_SETTINGS items we allow changing (e.g. log_level)
                # For now, only PersistentConfigs are updatable via this mechanism.
                # If it's a frontend_branding key, it's not a PersistentConfig.
                # If it's service.log_level, it's also not a PC.
                # This endpoint should primarily target PersistentConfigs.
                # Other settings (like service.host, service.port, service.data_dir, frontend_branding.*)
                # are set via settings_config.yaml and require app restart or different management.

                # Let's refine: only update PersistentConfigs.
                # If a key is not found in PERSISTENT_CONFIG_REGISTRY by its path, it's an error.
                 errors.append(f"Configuration key '{key_path}' not found or not updatable.")


        except ValueError as e: # Type error from update_persistent_config_by_path
            errors.append(str(e))
        except Exception as e:
            errors.append(f"Error updating '{key_path}': {str(e)}")

    if errors:
        # Decide if partial success is okay or all-or-nothing.
        # For now, report errors but apply successful changes.
        # A transaction model would be better for all-or-nothing.
        # PersistentConfig.save() commits individually.
        logging.warning(f"Update configuration encountered errors: {errors}")
        # Potentially raise HTTPException here if any error is critical
        # For now, we return current state, frontend should show errors.

    current_configs = get_manageable_configs(request_obj.app.state.config, SYSTEM_SETTINGS)
    # Include error messages in response if needed, or rely on toast notifications from frontend on 200 + errors
    # For now, just return the latest state. Frontend can compare.
    if errors:
         # A way to signal errors, though not in ConfigResponse model.
         # Could add an 'errors: List[str]' to ConfigResponse.
         # Or rely on frontend to show toast for each error from a separate error stream if API returned detailed errors.
         # Simplest for now: if any error, raise one HTTPException with all messages.
         raise HTTPException(status_code=400, detail=". ".join(errors))

    return ConfigResponse(configs=current_configs)
