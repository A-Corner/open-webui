from fastapi import APIRouter, Request, Depends
from typing import Dict, Any

from open_webui.core.branding import APP_BRANDING_CONFIG
# No specific auth for this endpoint as it's public branding info.
# If some parts of branding config were sensitive, auth would be needed.

router = APIRouter()

@router.get("/config", response_model=Dict[str, Any])
async def get_branding_config(request: Request):
    """
    Returns the application's branding configuration.
    This configuration is loaded from branding_config.json at startup.
    """
    # If APP_BRANDING_CONFIG needs to be part of app.state for some reason:
    # return request.app.state.APP_BRANDING_CONFIG
    # Otherwise, direct import is fine as it's loaded once.
    return APP_BRANDING_CONFIG
