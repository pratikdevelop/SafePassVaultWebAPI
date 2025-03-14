from fastapi import HTTPException
from models import SSOSettings  # Assuming Beanie model
from typing import Dict, Any, List

class SSOSettingsController:
    @staticmethod
    async def get_all_sso_settings() -> List[Dict[str, Any]]:
        """Retrieve all SSO settings."""
        try:
            settings = await SSOSettings.find_all().to_list()
            return [setting.dict() for setting in settings]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_all_sso_settings_by_provider(provider: str) -> Dict[str, Any]:
        """Retrieve SSO settings by provider."""
        try:
            settings = await SSOSettings.find_one(SSOSettings.provider == provider)
            if not settings:
                raise HTTPException(status_code=404, detail="Provider settings not found")
            return settings.dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def save_sso_settings(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update SSO settings."""
        provider = data.get("provider", "google")
        try:
            existing_settings = await SSOSettings.find_one(SSOSettings.provider == provider)
            if existing_settings:
                # Update existing settings
                for key, value in data.items():
                    if value is not None:
                        setattr(existing_settings, key, value)
                await existing_settings.save()
                return {"message": "Settings updated", "data": existing_settings.dict()}
            else:
                # Create new settings
                new_settings = SSOSettings(**data)
                await new_settings.insert()
                return {"message": "Settings saved", "data": new_settings.dict()}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def delete_settings(provider: str) -> Dict[str, Any]:
        """Delete SSO settings by provider."""
        try:
            settings = await SSOSettings.find_one(SSOSettings.provider == provider)
            if not settings:
                raise HTTPException(status_code=404, detail="Provider settings not found")
            await settings.delete()
            return {"message": "Settings deleted", "data": settings.dict()}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))