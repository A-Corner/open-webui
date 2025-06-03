from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel, ConfigDict

from typing import Optional

from open_webui.utils.auth import get_admin_user, get_verified_user
from open_webui.config import get_config, save_config
from open_webui.config import BannerModel

from open_webui.utils.tools import get_tool_server_data, get_tool_servers_data
from open_webui.config import PersistentConfig, PERSISTENT_CONFIG_REGISTRY # Import PersistentConfig and PERSISTENT_CONFIG_REGISTRY
from typing import Any, Dict, List


router = APIRouter()

# Helper function to update config items
def update_config_item_by_env_name(env_name: str, new_value: Any):
    """
    Updates a configuration item by its env_name in PERSISTENT_CONFIG_REGISTRY.
    """
    config_item_found = None
    for item in PERSISTENT_CONFIG_REGISTRY:
        if item.env_name == env_name:
            config_item_found = item
            break

    if config_item_found:
        original_type = type(config_item_found.env_value) # Base type on env_value
        try:
            if original_type == bool:
                typed_value = str(new_value).lower() in ["true", "1", "yes", "on"]
            elif original_type == int:
                typed_value = int(new_value)
            elif original_type == float:
                typed_value = float(new_value)
            elif original_type == list or original_type == dict:
                typed_value = new_value # Assumes Pydantic model already converted it
            else: # Primarily for strings
                typed_value = original_type(new_value)

            config_item_found.value = typed_value
            config_item_found.save()
        except ValueError as e:
            raise ValueError(f"Invalid value type for {env_name}. Expected {original_type.__name__}, got '{new_value}'. Error: {e}")
        except Exception as e:
            raise Exception(f"Error updating {env_name}: {e}")
    else:
        raise AttributeError(f"Config key (env_name) {env_name} not found in PERSISTENT_CONFIG_REGISTRY.")


# Pydantic Models for UI Configurations
class UIConfigUpdateForm(BaseModel):
    ENABLE_SIGNUP: Optional[bool] = None
    DEFAULT_MODELS: Optional[List[str]] = None # Example, assuming it's a list of strings
    WEBUI_URL: Optional[str] = None
    DEFAULT_LOCALE: Optional[str] = None
    ENABLE_COMMUNITY_SHARING: Optional[bool] = None
    ENABLE_MESSAGE_RATING: Optional[bool] = None
    # DEFAULT_PROMPT_SUGGESTIONS is complex, handled by its own endpoint for now

class UIConfigResponse(BaseModel):
    ENABLE_SIGNUP: bool
    DEFAULT_MODELS: Optional[List[str]]
    WEBUI_URL: str
    DEFAULT_LOCALE: str
    ENABLE_COMMUNITY_SHARING: bool
    ENABLE_MESSAGE_RATING: bool
    DEFAULT_PROMPT_SUGGESTIONS: List[Any] # Keep this for response consistency

# Pydantic Models for Auth Configurations
class AuthConfigUpdateForm(BaseModel):
    JWT_EXPIRES_IN: Optional[str] = None # Keep as string, validation might be needed if converting to int
    ENABLE_OAUTH_SIGNUP: Optional[bool] = None
    ENABLE_API_KEY: Optional[bool] = None
    DEFAULT_USER_ROLE: Optional[str] = None

class AuthConfigResponse(BaseModel):
    JWT_EXPIRES_IN: str
    ENABLE_OAUTH_SIGNUP: bool
    ENABLE_API_KEY: bool
    DEFAULT_USER_ROLE: str

# Pydantic Models for RAG Configurations
class RAGConfigUpdateForm(BaseModel):
    RAG_TEMPLATE: Optional[str] = None
    CHUNK_SIZE: Optional[int] = None
    CHUNK_OVERLAP: Optional[int] = None
    RAG_TOP_K: Optional[int] = None
    RAG_RELEVANCE_THRESHOLD: Optional[float] = None
    ENABLE_WEB_SEARCH: Optional[bool] = None
    WEB_SEARCH_ENGINE: Optional[str] = None
    WEB_SEARCH_RESULT_COUNT: Optional[int] = None
    PDF_EXTRACT_IMAGES: Optional[bool] = None

class RAGConfigResponse(BaseModel):
    RAG_TEMPLATE: str
    CHUNK_SIZE: int
    CHUNK_OVERLAP: int
    RAG_TOP_K: int
    RAG_RELEVANCE_THRESHOLD: float
    ENABLE_WEB_SEARCH: bool
    WEB_SEARCH_ENGINE: str
    WEB_SEARCH_RESULT_COUNT: int
    PDF_EXTRACT_IMAGES: bool


############################
# ImportConfig
############################


class ImportConfigForm(BaseModel):
    config: dict


@router.post("/import", response_model=dict)
async def import_config(form_data: ImportConfigForm, user=Depends(get_admin_user)):
    save_config(form_data.config)
    return get_config()


############################
# ExportConfig
############################


@router.get("/export", response_model=dict)
async def export_config(user=Depends(get_admin_user)):
    return get_config()


############################
# Direct Connections Config
############################


class DirectConnectionsConfigForm(BaseModel):
    ENABLE_DIRECT_CONNECTIONS: bool


@router.get("/direct_connections", response_model=DirectConnectionsConfigForm)
async def get_direct_connections_config(request: Request, user=Depends(get_admin_user)):
    return {
        "ENABLE_DIRECT_CONNECTIONS": request.app.state.config.ENABLE_DIRECT_CONNECTIONS,
    }


@router.post("/direct_connections", response_model=DirectConnectionsConfigForm)
async def set_direct_connections_config(
    request: Request,
    form_data: DirectConnectionsConfigForm,
    user=Depends(get_admin_user),
):
    request.app.state.config.ENABLE_DIRECT_CONNECTIONS = (
        form_data.ENABLE_DIRECT_CONNECTIONS
    )
    return {
        "ENABLE_DIRECT_CONNECTIONS": request.app.state.config.ENABLE_DIRECT_CONNECTIONS,
    }


############################
# ToolServers Config
############################


class ToolServerConnection(BaseModel):
    url: str
    path: str
    auth_type: Optional[str]
    key: Optional[str]
    config: Optional[dict]

    model_config = ConfigDict(extra="allow")


class ToolServersConfigForm(BaseModel):
    TOOL_SERVER_CONNECTIONS: list[ToolServerConnection]


@router.get("/tool_servers", response_model=ToolServersConfigForm)
async def get_tool_servers_config(request: Request, user=Depends(get_admin_user)):
    return {
        "TOOL_SERVER_CONNECTIONS": request.app.state.config.TOOL_SERVER_CONNECTIONS,
    }


@router.post("/tool_servers", response_model=ToolServersConfigForm)
async def set_tool_servers_config(
    request: Request,
    form_data: ToolServersConfigForm,
    user=Depends(get_admin_user),
):
    request.app.state.config.TOOL_SERVER_CONNECTIONS = [
        connection.model_dump() for connection in form_data.TOOL_SERVER_CONNECTIONS
    ]

    request.app.state.TOOL_SERVERS = await get_tool_servers_data(
        request.app.state.config.TOOL_SERVER_CONNECTIONS
    )

    return {
        "TOOL_SERVER_CONNECTIONS": request.app.state.config.TOOL_SERVER_CONNECTIONS,
    }


@router.post("/tool_servers/verify")
async def verify_tool_servers_config(
    request: Request, form_data: ToolServerConnection, user=Depends(get_admin_user)
):
    """
    Verify the connection to the tool server.
    """
    try:

        token = None
        if form_data.auth_type == "bearer":
            token = form_data.key
        elif form_data.auth_type == "session":
            token = request.state.token.credentials

        url = f"{form_data.url}/{form_data.path}"
        return await get_tool_server_data(token, url)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to connect to the tool server: {str(e)}",
        )


############################
# CodeInterpreterConfig
############################
class CodeInterpreterConfigForm(BaseModel):
    ENABLE_CODE_EXECUTION: bool
    CODE_EXECUTION_ENGINE: str
    CODE_EXECUTION_JUPYTER_URL: Optional[str]
    CODE_EXECUTION_JUPYTER_AUTH: Optional[str]
    CODE_EXECUTION_JUPYTER_AUTH_TOKEN: Optional[str]
    CODE_EXECUTION_JUPYTER_AUTH_PASSWORD: Optional[str]
    CODE_EXECUTION_JUPYTER_TIMEOUT: Optional[int]
    ENABLE_CODE_INTERPRETER: bool
    CODE_INTERPRETER_ENGINE: str
    CODE_INTERPRETER_PROMPT_TEMPLATE: Optional[str]
    CODE_INTERPRETER_JUPYTER_URL: Optional[str]
    CODE_INTERPRETER_JUPYTER_AUTH: Optional[str]
    CODE_INTERPRETER_JUPYTER_AUTH_TOKEN: Optional[str]
    CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD: Optional[str]
    CODE_INTERPRETER_JUPYTER_TIMEOUT: Optional[int]


@router.get("/code_execution", response_model=CodeInterpreterConfigForm)
async def get_code_execution_config(request: Request, user=Depends(get_admin_user)):
    return {
        "ENABLE_CODE_EXECUTION": request.app.state.config.ENABLE_CODE_EXECUTION,
        "CODE_EXECUTION_ENGINE": request.app.state.config.CODE_EXECUTION_ENGINE,
        "CODE_EXECUTION_JUPYTER_URL": request.app.state.config.CODE_EXECUTION_JUPYTER_URL,
        "CODE_EXECUTION_JUPYTER_AUTH": request.app.state.config.CODE_EXECUTION_JUPYTER_AUTH,
        "CODE_EXECUTION_JUPYTER_AUTH_TOKEN": request.app.state.config.CODE_EXECUTION_JUPYTER_AUTH_TOKEN,
        "CODE_EXECUTION_JUPYTER_AUTH_PASSWORD": request.app.state.config.CODE_EXECUTION_JUPYTER_AUTH_PASSWORD,
        "CODE_EXECUTION_JUPYTER_TIMEOUT": request.app.state.config.CODE_EXECUTION_JUPYTER_TIMEOUT,
        "ENABLE_CODE_INTERPRETER": request.app.state.config.ENABLE_CODE_INTERPRETER,
        "CODE_INTERPRETER_ENGINE": request.app.state.config.CODE_INTERPRETER_ENGINE,
        "CODE_INTERPRETER_PROMPT_TEMPLATE": request.app.state.config.CODE_INTERPRETER_PROMPT_TEMPLATE,
        "CODE_INTERPRETER_JUPYTER_URL": request.app.state.config.CODE_INTERPRETER_JUPYTER_URL,
        "CODE_INTERPRETER_JUPYTER_AUTH": request.app.state.config.CODE_INTERPRETER_JUPYTER_AUTH,
        "CODE_INTERPRETER_JUPYTER_AUTH_TOKEN": request.app.state.config.CODE_INTERPRETER_JUPYTER_AUTH_TOKEN,
        "CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD": request.app.state.config.CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD,
        "CODE_INTERPRETER_JUPYTER_TIMEOUT": request.app.state.config.CODE_INTERPRETER_JUPYTER_TIMEOUT,
    }


@router.post("/code_execution", response_model=CodeInterpreterConfigForm)
async def set_code_execution_config(
    request: Request, form_data: CodeInterpreterConfigForm, user=Depends(get_admin_user)
):
    app_config = request.app.state.config # Still useful for GETTING current values for response
    try:
        # Pass the env_name (which matches Pydantic field names) to the helper
        update_config_item_by_env_name("ENABLE_CODE_EXECUTION", form_data.ENABLE_CODE_EXECUTION)
        update_config_item_by_env_name("CODE_EXECUTION_ENGINE", form_data.CODE_EXECUTION_ENGINE)
        update_config_item_by_env_name("CODE_EXECUTION_JUPYTER_URL", form_data.CODE_EXECUTION_JUPYTER_URL)
        update_config_item_by_env_name("CODE_EXECUTION_JUPYTER_AUTH", form_data.CODE_EXECUTION_JUPYTER_AUTH)
        update_config_item_by_env_name("CODE_EXECUTION_JUPYTER_AUTH_TOKEN", form_data.CODE_EXECUTION_JUPYTER_AUTH_TOKEN)
        update_config_item_by_env_name("CODE_EXECUTION_JUPYTER_AUTH_PASSWORD", form_data.CODE_EXECUTION_JUPYTER_AUTH_PASSWORD)
        update_config_item_by_env_name("CODE_EXECUTION_JUPYTER_TIMEOUT", form_data.CODE_EXECUTION_JUPYTER_TIMEOUT)
        update_config_item_by_env_name("ENABLE_CODE_INTERPRETER", form_data.ENABLE_CODE_INTERPRETER)
        update_config_item_by_env_name("CODE_INTERPRETER_ENGINE", form_data.CODE_INTERPRETER_ENGINE)
        update_config_item_by_env_name("CODE_INTERPRETER_PROMPT_TEMPLATE", form_data.CODE_INTERPRETER_PROMPT_TEMPLATE)
        update_config_item_by_env_name("CODE_INTERPRETER_JUPYTER_URL", form_data.CODE_INTERPRETER_JUPYTER_URL)
        update_config_item_by_env_name("CODE_INTERPRETER_JUPYTER_AUTH", form_data.CODE_INTERPRETER_JUPYTER_AUTH)
        update_config_item_by_env_name("CODE_INTERPRETER_JUPYTER_AUTH_TOKEN", form_data.CODE_INTERPRETER_JUPYTER_AUTH_TOKEN)
        update_config_item_by_env_name("CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD", form_data.CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD)
        update_config_item_by_env_name("CODE_INTERPRETER_JUPYTER_TIMEOUT", form_data.CODE_INTERPRETER_JUPYTER_TIMEOUT)
    except (AttributeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    return {
        "ENABLE_CODE_EXECUTION": app_config.ENABLE_CODE_EXECUTION.value,
        "CODE_EXECUTION_ENGINE": app_config.CODE_EXECUTION_ENGINE.value,
        "CODE_EXECUTION_JUPYTER_URL": app_config.CODE_EXECUTION_JUPYTER_URL.value,
        "CODE_EXECUTION_JUPYTER_AUTH": app_config.CODE_EXECUTION_JUPYTER_AUTH.value,
        "CODE_EXECUTION_JUPYTER_AUTH_TOKEN": app_config.CODE_EXECUTION_JUPYTER_AUTH_TOKEN.value,
        "CODE_EXECUTION_JUPYTER_AUTH_PASSWORD": app_config.CODE_EXECUTION_JUPYTER_AUTH_PASSWORD.value,
        "CODE_EXECUTION_JUPYTER_TIMEOUT": app_config.CODE_EXECUTION_JUPYTER_TIMEOUT.value,
        "ENABLE_CODE_INTERPRETER": app_config.ENABLE_CODE_INTERPRETER.value,
        "CODE_INTERPRETER_ENGINE": app_config.CODE_INTERPRETER_ENGINE.value,
        "CODE_INTERPRETER_PROMPT_TEMPLATE": app_config.CODE_INTERPRETER_PROMPT_TEMPLATE.value,
        "CODE_INTERPRETER_JUPYTER_URL": app_config.CODE_INTERPRETER_JUPYTER_URL.value,
        "CODE_INTERPRETER_JUPYTER_AUTH": app_config.CODE_INTERPRETER_JUPYTER_AUTH.value,
        "CODE_INTERPRETER_JUPYTER_AUTH_TOKEN": app_config.CODE_INTERPRETER_JUPYTER_AUTH_TOKEN.value,
        "CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD": app_config.CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD.value,
        "CODE_INTERPRETER_JUPYTER_TIMEOUT": app_config.CODE_INTERPRETER_JUPYTER_TIMEOUT.value,
    }


############################
# SetDefaultModels
############################
class ModelsConfigForm(BaseModel):
    DEFAULT_MODELS: Optional[str]
    MODEL_ORDER_LIST: Optional[list[str]]


@router.get("/models", response_model=ModelsConfigForm)
async def get_models_config(request: Request, user=Depends(get_admin_user)):
    return {
        "DEFAULT_MODELS": request.app.state.config.DEFAULT_MODELS,
        "MODEL_ORDER_LIST": request.app.state.config.MODEL_ORDER_LIST,
    }


@router.post("/models", response_model=ModelsConfigForm)
async def set_models_config(
    request: Request, form_data: ModelsConfigForm, user=Depends(get_admin_user)
):
    app_config = request.app.state.config # Still useful for GETTING current values for response
    try:
        if form_data.DEFAULT_MODELS is not None:
            update_config_item_by_env_name("DEFAULT_MODELS", form_data.DEFAULT_MODELS)
        if form_data.MODEL_ORDER_LIST is not None:
            update_config_item_by_env_name("MODEL_ORDER_LIST", form_data.MODEL_ORDER_LIST)
    except (AttributeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    return {
        "DEFAULT_MODELS": app_config.DEFAULT_MODELS.value,
        "MODEL_ORDER_LIST": app_config.MODEL_ORDER_LIST.value,
    }


class PromptSuggestion(BaseModel):
    title: list[str]
    content: str


class SetDefaultSuggestionsForm(BaseModel):
    suggestions: list[PromptSuggestion]


@router.post("/suggestions", response_model=list[PromptSuggestion])
async def set_default_suggestions(
    request: Request,
    form_data: SetDefaultSuggestionsForm,
    user=Depends(get_admin_user),
):
    app_config = request.app.state.config # Still useful for GETTING current values for response
    try:
        # Assuming form_data.suggestions is already a list of dicts or Pydantic models
        update_config_item_by_env_name("DEFAULT_PROMPT_SUGGESTIONS", form_data.suggestions)
    except (AttributeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    return app_config.DEFAULT_PROMPT_SUGGESTIONS.value


############################
# SetBanners
############################


class SetBannersForm(BaseModel):
    banners: list[BannerModel]


@router.post("/banners", response_model=list[BannerModel])
async def set_banners(
    request: Request,
    form_data: SetBannersForm,
    user=Depends(get_admin_user),
):
    app_config = request.app.state.config # Still useful for GETTING current values for response
    try:
        banners_data = [banner.model_dump() for banner in form_data.banners]
        update_config_item_by_env_name("WEBUI_BANNERS", banners_data)
    except (AttributeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    return app_config.WEBUI_BANNERS.value


@router.get("/banners", response_model=list[BannerModel])
async def get_banners(
    request: Request,
    user=Depends(get_verified_user),
):
    # Assuming WEBUI_BANNERS is a PersistentConfig holding a list of banner dicts or BannerModel instances
    return request.app.state.config.WEBUI_BANNERS.value


##################################
# General UI Configurations
##################################

@router.get("/ui", response_model=UIConfigResponse)
async def get_ui_configs(request: Request, user=Depends(get_admin_user)):
    app_config = request.app.state.config
    return UIConfigResponse(
        ENABLE_SIGNUP=app_config.ENABLE_SIGNUP.value,
        DEFAULT_MODELS=app_config.DEFAULT_MODELS.value,
        WEBUI_URL=app_config.WEBUI_URL.value,
        DEFAULT_LOCALE=app_config.DEFAULT_LOCALE.value,
        ENABLE_COMMUNITY_SHARING=app_config.ENABLE_COMMUNITY_SHARING.value,
        ENABLE_MESSAGE_RATING=app_config.ENABLE_MESSAGE_RATING.value,
        DEFAULT_PROMPT_SUGGESTIONS=app_config.DEFAULT_PROMPT_SUGGESTIONS.value,
    )

@router.put("/ui", response_model=UIConfigResponse)
async def set_ui_configs(
    request: Request, form_data: UIConfigUpdateForm, user=Depends(get_admin_user)
):
    app_config = request.app.state.config
    updated_fields = form_data.model_dump(exclude_unset=True)

    try:
        for key, value in updated_fields.items():
            update_config_item_by_env_name(key, value) # Key here is the Pydantic field name, should match env_name
    except (AttributeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    return await get_ui_configs(request, user)


##################################
# Auth Configurations
##################################

@router.get("/auth", response_model=AuthConfigResponse)
async def get_auth_configs(request: Request, user=Depends(get_admin_user)):
    app_config = request.app.state.config
    return AuthConfigResponse(
        JWT_EXPIRES_IN=app_config.JWT_EXPIRES_IN.value,
        ENABLE_OAUTH_SIGNUP=app_config.ENABLE_OAUTH_SIGNUP.value,
        ENABLE_API_KEY=app_config.ENABLE_API_KEY.value,
        DEFAULT_USER_ROLE=app_config.DEFAULT_USER_ROLE.value,
    )

@router.put("/auth", response_model=AuthConfigResponse)
async def set_auth_configs(
    request: Request, form_data: AuthConfigUpdateForm, user=Depends(get_admin_user)
):
    app_config = request.app.state.config
    updated_fields = form_data.model_dump(exclude_unset=True)

    try:
        for key, value in updated_fields.items():
            update_config_item_by_env_name(key, value) # Key here is the Pydantic field name, should match env_name
    except (AttributeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    return await get_auth_configs(request, user)


##################################
# RAG Configurations
##################################

@router.get("/rag", response_model=RAGConfigResponse)
async def get_rag_configs(request: Request, user=Depends(get_admin_user)):
    app_config = request.app.state.config
    return RAGConfigResponse(
        RAG_TEMPLATE=app_config.RAG_TEMPLATE.value,
        CHUNK_SIZE=app_config.CHUNK_SIZE.value,
        CHUNK_OVERLAP=app_config.CHUNK_OVERLAP.value,
        RAG_TOP_K=app_config.RAG_TOP_K.value,
        RAG_RELEVANCE_THRESHOLD=app_config.RAG_RELEVANCE_THRESHOLD.value,
        ENABLE_WEB_SEARCH=app_config.ENABLE_WEB_SEARCH.value,
        WEB_SEARCH_ENGINE=app_config.WEB_SEARCH_ENGINE.value,
        WEB_SEARCH_RESULT_COUNT=app_config.WEB_SEARCH_RESULT_COUNT.value,
        PDF_EXTRACT_IMAGES=app_config.PDF_EXTRACT_IMAGES.value,
    )

@router.put("/rag", response_model=RAGConfigResponse)
async def set_rag_configs(
    request: Request, form_data: RAGConfigUpdateForm, user=Depends(get_admin_user)
):
    app_config = request.app.state.config
    updated_fields = form_data.model_dump(exclude_unset=True)

    try:
        for key, value in updated_fields.items():
            update_config_item_by_env_name(key, value) # Key here is the Pydantic field name, should match env_name
    except (AttributeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    return await get_rag_configs(request, user)
