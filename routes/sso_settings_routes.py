from fastapi import APIRouter
from controllers.sso_settings_controller import SSOSettingsController

router = APIRouter(prefix="/sso-settings", tags=["SSO Settings"])

@router.post("/", response_model=dict)
async def save_sso_settings(data: dict):
    return await SSOSettingsController.save_sso_settings(data)

@router.get("/", response_model=list)
async def get_all_sso_settings():
    return await SSOSettingsController.get_all_sso_settings()

@router.get("/{provider}", response_model=list)
async def get_all_sso_settings_by_provider(provider: str):
    return await SSOSettingsController.get_all_sso_settings_by_provider(provider)

@router.delete("/{provider}", response_model=dict)
async def delete_settings(provider: str):
    return await SSOSettingsController.delete_settings(provider)